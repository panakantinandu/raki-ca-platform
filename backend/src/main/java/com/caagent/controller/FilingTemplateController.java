package com.caagent.controller;

import com.caagent.dto.FilingTemplateRequest;
import com.caagent.model.FilingTemplate;
import com.caagent.security.UserPrincipal;
import com.caagent.service.FilingTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/filing-templates")
@RequiredArgsConstructor
public class FilingTemplateController {

    private final FilingTemplateService filingTemplateService;

    @GetMapping
    public List<FilingTemplate> listForClient(@AuthenticationPrincipal UserPrincipal principal,
                                               @RequestParam UUID clientId) {
        return filingTemplateService.listForClient(principal.getUserId(), clientId);
    }

    @PostMapping
    public ResponseEntity<FilingTemplate> create(@AuthenticationPrincipal UserPrincipal principal,
                                                  @Valid @RequestBody FilingTemplateRequest req) {
        return ResponseEntity.ok(filingTemplateService.createTemplate(principal.getUserId(), req));
    }

    @PatchMapping("/{id}/deactivate")
    public FilingTemplate deactivate(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return filingTemplateService.deactivate(principal.getUserId(), id);
    }

    // Manual trigger for the daily job (see FilingTemplateScheduler) that normally runs at 02:00 -
    // any authenticated user can fast-forward it on demand; it's idempotent, cheap, and only
    // ever returns a count, never other accounts' data.
    @PostMapping("/run-due-job")
    public Map<String, Integer> runDueJob(@AuthenticationPrincipal UserPrincipal principal) {
        int created = filingTemplateService.generateDueFilings();
        return Map.of("created", created);
    }
}
