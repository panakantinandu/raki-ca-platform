package com.caagent.controller;

import com.caagent.dto.AdminReplyRequest;
import com.caagent.dto.AdminStatsResponse;
import com.caagent.model.ContactSubmission;
import com.caagent.model.SupportTicket;
import com.caagent.security.UserPrincipal;
import com.caagent.service.AdminService;
import com.caagent.service.ContactService;
import com.caagent.service.FilingService;
import com.caagent.service.FilingTemplateService;
import com.caagent.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ContactService contactService;
    private final SupportTicketService supportTicketService;
    private final FilingService filingService;
    private final FilingTemplateService filingTemplateService;

    @GetMapping("/stats")
    public AdminStatsResponse getStats(@AuthenticationPrincipal UserPrincipal principal) {
        adminService.assertIsAdmin(principal.getUserId());
        return adminService.getStats();
    }

    @GetMapping("/contact-submissions")
    public Page<ContactSubmission> listContactSubmissions(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        adminService.assertIsAdmin(principal.getUserId());
        return contactService.list(pageable);
    }

    @GetMapping("/support-tickets")
    public Page<SupportTicket> listSupportTickets(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        adminService.assertIsAdmin(principal.getUserId());
        return supportTicketService.listAll(pageable);
    }

    @PostMapping("/support-tickets/{id}/reply")
    public SupportTicket replySupportTicket(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                             @Valid @RequestBody AdminReplyRequest req) {
        adminService.assertIsAdmin(principal.getUserId());
        return supportTicketService.reply(id, req.reply());
    }

    // Manual triggers for the two daily scheduled jobs - useful for ops (re-running after an
    // incident) and for verifying notification-generating behavior without waiting for cron.
    @PostMapping("/jobs/check-overdue-filings")
    public Map<String, Integer> triggerOverdueCheck(@AuthenticationPrincipal UserPrincipal principal) {
        adminService.assertIsAdmin(principal.getUserId());
        return Map.of("markedOverdue", filingService.markOverdueAndNotify());
    }

    @PostMapping("/jobs/generate-recurring-filings")
    public Map<String, Integer> triggerRecurringFilings(@AuthenticationPrincipal UserPrincipal principal) {
        adminService.assertIsAdmin(principal.getUserId());
        return Map.of("created", filingTemplateService.generateDueFilings());
    }
}
