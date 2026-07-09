package com.caagent.service;

import com.caagent.exception.ApiException;
import com.caagent.model.Notification;
import com.caagent.model.User;
import com.caagent.repository.NotificationRepository;
import com.caagent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Polling-based, not push: the frontend calls GET /api/notifications every 15-30s (see
 * NotificationController). That's simple and reliable for this app's scale; a WebSocket/SSE
 * push channel would feel more "instant" but isn't worth the added infra/connection-management
 * complexity yet - revisit if notification latency actually becomes a user complaint.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void create(UUID ownerId, Notification.Type type, String message, UUID referenceId, String referenceType) {
        User owner = userRepository.getReferenceById(ownerId);
        notificationRepository.save(Notification.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .type(type)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build());
    }

    public Page<Notification> list(UUID ownerId, int page, int size) {
        return notificationRepository.findByOwnerIdUnreadFirst(ownerId, PageRequest.of(page, size));
    }

    public long unreadCount(UUID ownerId) {
        return notificationRepository.countByOwnerIdAndReadAtIsNull(ownerId);
    }

    @Transactional
    public Notification markRead(UUID ownerId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndOwnerId(notificationId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Notification not found."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
        }
        return notification;
    }
}
