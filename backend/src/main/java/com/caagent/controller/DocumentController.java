package com.caagent.controller;

import com.caagent.dto.ExtractedDataRequest;
import com.caagent.model.Document;
import com.caagent.security.UserPrincipal;
import com.caagent.service.DocumentExtractionService;
import com.caagent.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentExtractionService documentExtractionService;

    @GetMapping
    public Page<Document> list(@AuthenticationPrincipal UserPrincipal principal,
                                @RequestParam(required = false) UUID clientId,
                                Pageable pageable) {
        return documentService.listDocuments(principal.getUserId(), clientId, pageable);
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Document> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID clientId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(documentService.upload(principal.getUserId(), clientId, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        documentService.deleteDocument(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    // Explicit, user-triggered action only - this calls a paid external API, so it must never
    // run automatically (e.g. on upload). Has its own tighter rate limit (see RateLimitFilter)
    // and a plan-based monthly cap (see DocumentExtractionService.enforceMonthlyLimit).
    @PostMapping("/{id}/extract")
    public Document extract(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return documentExtractionService.extractDocument(principal.getUserId(), id);
    }

    // Saves the CA's reviewed (possibly corrected) values - the AI's own output is never
    // relied on anywhere else until this confirmation happens.
    @PutMapping("/{id}/extracted-data")
    public Document confirmExtractedData(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                          @Valid @RequestBody ExtractedDataRequest req) {
        return documentExtractionService.confirmExtractedData(principal.getUserId(), id, req);
    }
}
