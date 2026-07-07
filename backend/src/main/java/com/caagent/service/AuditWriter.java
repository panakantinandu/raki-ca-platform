package com.caagent.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Split out from AuditService so @Async/@Transactional actually apply: calling this method from
 * within AuditService itself would be a self-invocation, which bypasses Spring's proxy and
 * silently ignores both annotations.
 */
@Component
@RequiredArgsConstructor
public class AuditWriter {

    private final EntityManager entityManager;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void insert(UUID userId, String action, String entityType, String entityId, String ip) {
        entityManager.createNativeQuery(
                "INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, ip_address, created_at) " +
                "VALUES (:id, :userId, :action, :entityType, :entityId, :ip, :createdAt)")
                .setParameter("id", UUID.randomUUID())
                .setParameter("userId", userId)
                .setParameter("action", action)
                .setParameter("entityType", entityType)
                .setParameter("entityId", entityId)
                .setParameter("ip", ip)
                .setParameter("createdAt", Instant.now())
                .executeUpdate();
    }
}
