package com.caagent.controller;

import com.caagent.dto.ContactRequest;
import com.caagent.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Public, unauthenticated - see SecurityConfig's explicit permitAll for POST /api/public/contact.
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/contact")
    public ResponseEntity<Void> submit(@Valid @RequestBody ContactRequest req) {
        contactService.submit(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
