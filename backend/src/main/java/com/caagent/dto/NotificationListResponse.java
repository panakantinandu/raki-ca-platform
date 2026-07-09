package com.caagent.dto;

import com.caagent.model.Notification;

import java.util.List;

public record NotificationListResponse(
        List<Notification> notifications,
        long totalElements,
        long unreadCount
) {}
