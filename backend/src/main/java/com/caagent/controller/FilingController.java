package com.caagent.controller;

import com.caagent.dto.BulkFilingCreateRequest;
import com.caagent.dto.BulkMarkFiledRequest;
import com.caagent.dto.FilingRequest;
import com.caagent.model.Filing;
import com.caagent.security.UserPrincipal;
import com.caagent.service.FilingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/filings")
@RequiredArgsConstructor
public class FilingController {

    private final FilingService filingService;

    @GetMapping
    public Page<Filing> list(@AuthenticationPrincipal UserPrincipal principal,
                              @RequestParam(required = false) UUID clientId,
                              Pageable pageable) {
        return filingService.listFilings(principal.getUserId(), clientId, pageable);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@AuthenticationPrincipal UserPrincipal principal) {
        byte[] body = filingService.exportCsv(principal.getUserId()).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"filings.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }

    @GetMapping("/calendar")
    public List<FilingService.CalendarEntry> calendar(@AuthenticationPrincipal UserPrincipal principal,
                                                        @RequestParam int month, @RequestParam int year) {
        return filingService.getCalendarFilings(principal.getUserId(), month, year);
    }

    @PostMapping
    public ResponseEntity<Filing> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody FilingRequest req) {
        return ResponseEntity.ok(filingService.createFiling(principal.getUserId(), req));
    }

    @PatchMapping("/{id}/status")
    public Filing updateStatus(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, @RequestParam String status) {
        return filingService.updateStatus(principal.getUserId(), id, status);
    }

    @PatchMapping("/{id}/mark-filed")
    public Filing markFiled(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return filingService.markFiled(principal.getUserId(), id);
    }

    @PostMapping("/bulk-create")
    public List<FilingService.BulkCreateResult> bulkCreate(@AuthenticationPrincipal UserPrincipal principal,
                                                             @Valid @RequestBody BulkFilingCreateRequest req) {
        return filingService.bulkCreateFilings(principal.getUserId(), req);
    }

    @PatchMapping("/bulk-mark-filed")
    public List<FilingService.BulkMarkFiledResult> bulkMarkFiled(@AuthenticationPrincipal UserPrincipal principal,
                                                                   @Valid @RequestBody BulkMarkFiledRequest req) {
        return filingService.bulkMarkFiled(principal.getUserId(), req.filingIds());
    }
}
