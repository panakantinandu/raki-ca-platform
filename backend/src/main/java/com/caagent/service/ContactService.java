package com.caagent.service;

import com.caagent.dto.ContactRequest;
import com.caagent.model.ContactSubmission;
import com.caagent.repository.ContactSubmissionRepository;
import com.caagent.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactSubmissionRepository contactSubmissionRepository;
    private final EmailService emailService;

    @Transactional
    public ContactSubmission submit(ContactRequest req) {
        ContactSubmission submission = ContactSubmission.builder()
                .id(UUID.randomUUID())
                .name(InputSanitizer.sanitizePlainText(req.name()))
                .email(req.email())
                .message(InputSanitizer.sanitizePlainText(req.message()))
                .build();
        submission = contactSubmissionRepository.save(submission);

        // Same swap-later pattern as password reset emails (see EmailService) - logs today,
        // becomes a real notification the moment a provider is configured, no call-site change.
        emailService.sendContactFormNotification(submission.getName(), submission.getEmail(), submission.getMessage());

        return submission;
    }

    public Page<ContactSubmission> list(Pageable pageable) {
        return contactSubmissionRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
