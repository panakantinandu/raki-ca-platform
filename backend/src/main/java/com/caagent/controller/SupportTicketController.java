package com.caagent.controller;

import com.caagent.dto.SupportTicketRequest;
import com.caagent.model.SupportTicket;
import com.caagent.security.UserPrincipal;
import com.caagent.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    @GetMapping
    public Page<SupportTicket> list(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return supportTicketService.listForUser(principal.getUserId(), pageable);
    }

    @PostMapping
    public ResponseEntity<SupportTicket> create(@AuthenticationPrincipal UserPrincipal principal,
                                                 @Valid @RequestBody SupportTicketRequest req) {
        SupportTicket ticket = supportTicketService.createTicket(principal.getUserId(), req.subject(), req.message());
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }
}
