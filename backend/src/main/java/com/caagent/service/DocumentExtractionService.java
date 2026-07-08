package com.caagent.service;

import com.caagent.dto.ExtractedDataRequest;
import com.caagent.exception.ApiException;
import com.caagent.model.Document;
import com.caagent.model.DocumentExtractionCall;
import com.caagent.model.Subscription;
import com.caagent.model.User;
import com.caagent.repository.DocumentExtractionCallRepository;
import com.caagent.repository.DocumentRepository;
import com.caagent.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentExtractionService {

    // Vision-capable content types only - CSV/XLSX have no visual layout for Claude to read.
    private static final Set<String> EXTRACTABLE_CONTENT_TYPES = Set.of(
            "application/pdf", "image/png", "image/jpeg");

    private static final List<String> FIELD_KEYS = List.of("gstin", "documentNumber", "amount", "date", "vendorName");

    private static final String EXTRACTION_PROMPT = """
            You are analyzing a scanned invoice or financial document for a chartered accountant.
            Respond with ONLY a single JSON object (no markdown formatting, no code fences, no \
            explanation before or after) with exactly these keys:
            - gstin: the GSTIN (GST Identification Number), or null if not present
            - documentNumber: the invoice or document number, or null if not present
            - amount: the total amount as a plain number with no currency symbol or commas, or null if not present
            - date: the document date in YYYY-MM-DD format, or null if not present or ambiguous
            - vendorName: the vendor or party name, or null if not present

            If this document is not an invoice and does not contain these fields, return all five \
            values as null. Only extract what is actually visible in the document - never guess or \
            fabricate a value.""";

    private final DocumentRepository documentRepository;
    private final DocumentExtractionCallRepository extractionCallRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final AnthropicClient anthropicClient;
    private final ObjectMapper objectMapper;

    /**
     * Explicit, user-triggered only (never automatic on upload - this costs real money per
     * call). Always persists whatever was extracted, even a fully-null/partial result, and
     * never auto-files or auto-applies the result anywhere else - the CA must separately
     * confirm it via confirmExtractedData.
     *
     * Deliberately NOT @Transactional: the Anthropic call is a slow external HTTP request, and
     * this method must keep no DB transaction open across it. Each repository.save() below
     * commits on its own, which is also what makes the FAILED-status write below survive when
     * the method exits via an exception - wrapping the whole method in one @Transactional would
     * roll that save back along with everything else the moment the exception propagates.
     */
    public Document extractDocument(UUID ownerId, UUID documentId) {
        Document document = documentRepository.findByIdAndOwnerId(documentId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Document not found."));

        if (!EXTRACTABLE_CONTENT_TYPES.contains(document.getContentType())) {
            throw ApiException.badRequest("Extraction is only supported for PDF, PNG, or JPEG documents.");
        }

        enforceMonthlyLimit(ownerId);

        User owner = userRepository.getReferenceById(ownerId);
        extractionCallRepository.save(DocumentExtractionCall.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .document(document)
                .build());

        document.setExtractionStatus(Document.ExtractionStatus.PENDING);
        documentRepository.save(document);

        byte[] fileBytes;
        try {
            fileBytes = Files.readAllBytes(Path.of(document.getStorageKey()));
        } catch (IOException e) {
            document.setExtractionStatus(Document.ExtractionStatus.FAILED);
            document.setExtractedAt(Instant.now());
            documentRepository.save(document);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "EXTRACTION_FAILED", "Could not read the stored document file.");
        }

        try {
            String rawText = anthropicClient.extract(fileBytes, document.getContentType(), EXTRACTION_PROMPT);
            Map<String, Object> extracted = parseExtractionResult(rawText);
            document.setExtractedData(extracted);
            document.setExtractionStatus(Document.ExtractionStatus.COMPLETED);
            document.setExtractedAt(Instant.now());
            return documentRepository.save(document);
        } catch (ApiException e) {
            // The Anthropic call itself failed (network/timeout/non-200) - record that plainly,
            // never silently swallow it back to the frontend as if nothing happened.
            document.setExtractionStatus(Document.ExtractionStatus.FAILED);
            document.setExtractedAt(Instant.now());
            documentRepository.save(document);
            throw e;
        }
    }

    @Transactional
    public Document confirmExtractedData(UUID ownerId, UUID documentId, ExtractedDataRequest req) {
        Document document = documentRepository.findByIdAndOwnerId(documentId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Document not found."));

        Map<String, Object> confirmed = new LinkedHashMap<>();
        confirmed.put("gstin", blankToNull(req.gstin()));
        confirmed.put("documentNumber", blankToNull(req.documentNumber()));
        confirmed.put("amount", blankToNull(req.amount()));
        confirmed.put("date", blankToNull(req.date()));
        confirmed.put("vendorName", blankToNull(req.vendorName()));
        confirmed.put("partial", false);
        confirmed.put("humanConfirmed", true);

        document.setExtractedData(confirmed);
        document.setExtractionStatus(Document.ExtractionStatus.COMPLETED);
        return documentRepository.save(document);
    }

    private void enforceMonthlyLimit(UUID ownerId) {
        Subscription subscription = subscriptionService.getCurrentSubscription(ownerId);
        Integer maxExtractions = subscription.getPlan().getMaxExtractionsMonthly();
        if (maxExtractions == null) {
            return; // unlimited on this plan
        }
        Instant monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        long usedThisMonth = extractionCallRepository.countByOwnerIdAndCreatedAtAfter(ownerId, monthStart);
        if (usedThisMonth >= maxExtractions) {
            throw ApiException.forbidden(
                    "You've used all " + maxExtractions + " document extractions included in your plan this month. " +
                    "Upgrade your plan for more.");
        }
    }

    /**
     * Never throws. Tries a strict JSON parse first (stripping any markdown fencing Claude
     * might have added despite instructions); falls back to a per-field regex scan of the raw
     * text if that fails. Always returns all five keys, null for anything unreadable, plus a
     * "partial" flag set whenever the result isn't a clean, complete strict parse.
     */
    private Map<String, Object> parseExtractionResult(String rawText) {
        Map<String, Object> result = new LinkedHashMap<>();
        boolean strictParseSucceeded = false;

        String jsonCandidate = extractJsonObject(rawText);
        if (jsonCandidate != null) {
            try {
                Map<?, ?> parsed = objectMapper.readValue(jsonCandidate, Map.class);
                for (String key : FIELD_KEYS) {
                    Object value = parsed.get(key);
                    result.put(key, ("".equals(value)) ? null : value);
                }
                strictParseSucceeded = true;
            } catch (JsonProcessingException e) {
                log.warn("Extraction response was not valid JSON, falling back to regex scan: {}", e.getMessage());
            }
        }

        if (!strictParseSucceeded) {
            for (String key : FIELD_KEYS) {
                result.put(key, extractFieldWithRegex(rawText, key));
            }
        }

        boolean partial = !strictParseSucceeded || FIELD_KEYS.stream().anyMatch(k -> result.get(k) == null);
        result.put("partial", partial);
        result.put("humanConfirmed", false);
        return result;
    }

    private String extractJsonObject(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start == -1 || end == -1 || end < start) {
            return null;
        }
        return text.substring(start, end + 1);
    }

    private String extractFieldWithRegex(String text, String key) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key) + "\"\\s*:\\s*(\"([^\"]*)\"|[0-9.]+|null)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        String raw = matcher.group(1);
        if (raw == null || "null".equals(raw)) {
            return null;
        }
        String quoted = matcher.group(2);
        return quoted != null ? quoted : raw;
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
