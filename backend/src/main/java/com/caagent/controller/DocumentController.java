package com.caagent.controller;

import com.caagent.model.Document;
import com.caagent.security.UserPrincipal;
import com.caagent.service.DocumentService;
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
}
