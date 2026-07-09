package com.caagent.service;

import com.caagent.exception.ApiException;
import com.caagent.model.SupportTicket;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Layer B of the Support tab: instant AI-assisted answers on top of Layer A's ticket system.
 * Uses the same AnthropicClient already built for document extraction - same account, same
 * "never guess" contract - so this activates automatically the moment a real ANTHROPIC_API_KEY
 * is configured, no separate wiring needed.
 *
 * Never returns a possibly-wrong answer: the model is instructed to only answer when the FAQ
 * context actually covers the question, and to say so explicitly (confident=false) otherwise.
 * Any failure to get a usable, confident answer - the API call erroring out (bad/placeholder
 * key, network issue, Anthropic outage), an unparseable response, or the model itself saying
 * confident=false - takes the exact same fallback path: create a support ticket from the
 * question and tell the user a human will follow up. This is what makes Layer B safe to ship
 * today, before a real API key exists: every path through ask() either returns a real answer
 * or degrades to "I've created a ticket," never a hallucination and never an unhandled error.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupportChatService {

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are a support assistant for Raki, a SaaS practice-management tool for Chartered \
            Accountant firms in India. Answer ONLY using the context below - never guess, never \
            use outside knowledge about the product.

            If the user's question is clearly answered by the context, respond with ONLY this \
            JSON object (no markdown, no code fences, no explanation): \
            {"confident": true, "answer": "<a concise, plain-text answer>"}

            If the question is not covered by the context, or you are not confident the context \
            fully answers it, respond with ONLY: {"confident": false, "answer": null}

            CONTEXT:
            %s
            """;

    private final AnthropicClient anthropicClient;
    private final SupportTicketService supportTicketService;
    private final ObjectMapper objectMapper;

    public record ChatResult(boolean answered, String answer, UUID fallbackTicketId) {}

    public ChatResult ask(UUID userId, String question) {
        String systemPrompt = SYSTEM_PROMPT_TEMPLATE.formatted(SupportFaqContent.TEXT);

        String rawResponse;
        try {
            rawResponse = anthropicClient.chatText(systemPrompt, question);
        } catch (ApiException e) {
            // Covers "no real key configured yet" (placeholder key -> 401 -> non-200 -> here)
            // as well as genuine outages/timeouts - all handled identically by design.
            log.info("Support AI chat unavailable ({}), falling back to a ticket.", e.getErrorCode());
            return fallback(userId, question);
        }

        String answer = tryParseConfidentAnswer(rawResponse);
        if (answer != null) {
            return new ChatResult(true, answer, null);
        }
        return fallback(userId, question);
    }

    private String tryParseConfidentAnswer(String rawResponse) {
        try {
            String jsonCandidate = extractJsonObject(rawResponse);
            JsonNode parsed = objectMapper.readTree(jsonCandidate);
            boolean confident = parsed.path("confident").asBoolean(false);
            JsonNode answerNode = parsed.path("answer");
            if (confident && answerNode.isTextual() && !answerNode.asText().isBlank()) {
                return answerNode.asText();
            }
            return null;
        } catch (Exception e) {
            log.warn("Could not parse support AI response, treating as not confident: {}", e.getMessage());
            return null;
        }
    }

    private ChatResult fallback(UUID userId, String question) {
        SupportTicket ticket = supportTicketService.createTicket(
                userId, "AI chat: " + truncate(question, 80), question);
        return new ChatResult(false,
                "I'm not certain - I've created a support ticket for our team to follow up.",
                ticket.getId());
    }

    private String extractJsonObject(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start == -1 || end == -1 || end < start) {
            return "{}";
        }
        return text.substring(start, end + 1);
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
