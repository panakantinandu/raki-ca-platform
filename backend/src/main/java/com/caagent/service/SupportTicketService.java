package com.caagent.service;

import com.caagent.exception.ApiException;
import com.caagent.model.Notification;
import com.caagent.model.SupportTicket;
import com.caagent.model.User;
import com.caagent.repository.SupportTicketRepository;
import com.caagent.repository.UserRepository;
import com.caagent.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public SupportTicket createTicket(UUID ownerId, String subject, String message) {
        User owner = userRepository.getReferenceById(ownerId);
        SupportTicket ticket = SupportTicket.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .subject(InputSanitizer.sanitizePlainText(subject))
                .message(InputSanitizer.sanitizePlainText(message))
                .status(SupportTicket.Status.OPEN)
                .build();
        return supportTicketRepository.save(ticket);
    }

    public Page<SupportTicket> listForUser(UUID ownerId, Pageable pageable) {
        return supportTicketRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId, pageable);
    }

    public Page<SupportTicket> listAll(Pageable pageable) {
        return supportTicketRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional
    public SupportTicket reply(UUID ticketId, String reply) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Ticket not found."));
        ticket.setAdminReply(InputSanitizer.sanitizePlainText(reply));
        ticket.setRepliedAt(Instant.now());
        ticket.setStatus(SupportTicket.Status.ANSWERED);
        ticket = supportTicketRepository.save(ticket);

        notificationService.create(ticket.getOwner().getId(), Notification.Type.SUPPORT_TICKET_REPLIED,
                "Our team replied to your support ticket: \"" + ticket.getSubject() + "\"",
                ticket.getId(), "TICKET");

        return ticket;
    }
}
