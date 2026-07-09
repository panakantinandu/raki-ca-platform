package com.caagent.controller;

import com.caagent.dto.NotificationListResponse;
import com.caagent.model.Notification;
import com.caagent.security.UserPrincipal;
import com.caagent.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public NotificationListResponse list(@AuthenticationPrincipal UserPrincipal principal,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        Page<Notification> result = notificationService.list(principal.getUserId(), page, size);
        long unread = notificationService.unreadCount(principal.getUserId());
        return new NotificationListResponse(result.getContent(), result.getTotalElements(), unread);
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return notificationService.markRead(principal.getUserId(), id);
    }
}
