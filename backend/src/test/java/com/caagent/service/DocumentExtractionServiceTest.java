package com.caagent.service;

import com.caagent.exception.ApiException;
import com.caagent.model.*;
import com.caagent.repository.DocumentExtractionCallRepository;
import com.caagent.repository.DocumentRepository;
import com.caagent.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Covers the QUOTA DECISION documented in DocumentExtractionService#extractDocument: an
 * extraction attempt only counts against the monthly plan quota once Anthropic actually
 * returned a billed (200) response, never when the failure happened on our/Anthropic's side
 * before that (network error, timeout, non-200 - including a bad API key).
 */
@ExtendWith(MockitoExtension.class)
class DocumentExtractionServiceTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private DocumentExtractionCallRepository extractionCallRepository;
    @Mock private UserRepository userRepository;
    @Mock private SubscriptionService subscriptionService;
    @Mock private AnthropicClient anthropicClient;
    @Mock private NotificationService notificationService;

    private DocumentExtractionService service;

    @TempDir
    Path tempDir;

    private UUID ownerId;
    private UUID documentId;
    private Document document;

    @BeforeEach
    void setUp() throws Exception {
        service = new DocumentExtractionService(
                documentRepository, extractionCallRepository, userRepository,
                subscriptionService, anthropicClient, new ObjectMapper(), notificationService);

        ownerId = UUID.randomUUID();
        documentId = UUID.randomUUID();

        Path storedFile = tempDir.resolve("invoice.pdf");
        Files.write(storedFile, "fake pdf bytes".getBytes());

        document = Document.builder()
                .id(documentId)
                .contentType("application/pdf")
                .storageKey(storedFile.toString())
                .build();

        when(documentRepository.findByIdAndOwnerId(documentId, ownerId)).thenReturn(Optional.of(document));
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));

        Plan plan = Plan.builder().maxExtractionsMonthly(null).build(); // unlimited, quota check itself not under test here
        Subscription subscription = Subscription.builder().plan(plan).build();
        when(subscriptionService.getCurrentSubscription(ownerId)).thenReturn(subscription);
    }

    @Test
    void apiSideFailure_doesNotCountAgainstQuota() {
        // Simulates AnthropicClient's own failure modes (network error, timeout, non-200,
        // including a bad/placeholder API key) - it throws before any billed response exists.
        when(anthropicClient.extract(any(), any(), any()))
                .thenThrow(new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                        "EXTRACTION_UNAVAILABLE", "Could not reach the document extraction service."));

        assertThatThrownBy(() -> service.extractDocument(ownerId, documentId))
                .isInstanceOf(ApiException.class);

        // The whole point of the fix: no usage row is recorded for a call Anthropic never billed.
        verify(extractionCallRepository, never()).save(any());
        assertThat(document.getExtractionStatus()).isEqualTo(Document.ExtractionStatus.FAILED);
    }

    @Test
    void processedButUnreadableDocument_stillCountsAgainstQuota() {
        // Anthropic returned a real (200) response - it looked at the document and genuinely
        // found nothing invoice-shaped in it. That's still a paid API call.
        when(anthropicClient.extract(any(), any(), any()))
                .thenReturn("{\"gstin\": null, \"documentNumber\": null, \"amount\": null, "
                        + "\"date\": null, \"vendorName\": null}");
        when(userRepository.getReferenceById(ownerId)).thenReturn(User.builder().id(ownerId).build());

        Document result = service.extractDocument(ownerId, documentId);

        verify(extractionCallRepository, times(1)).save(any());
        assertThat(result.getExtractionStatus()).isEqualTo(Document.ExtractionStatus.COMPLETED);
        assertThat(result.getExtractedData().get("partial")).isEqualTo(true);
    }
}
