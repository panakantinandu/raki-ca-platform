package com.caagent.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

/**
 * Writes security-relevant events (logins, plan changes, deletions) to the
 * audit_logs table. The actual insert runs async so it never adds latency to
 * the user-facing request path.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditWriter auditWriter;

    /**
     * If called from within an active transaction (e.g. USER_REGISTERED, logged right after
     * saving the new user), defers the actual insert until that transaction commits - otherwise
     * the async write can race ahead of the commit and violate audit_logs_user_id_fkey.
     */
    public void log(UUID userId, String action, String entityType, String entityId, HttpServletRequest request) {
        String ip = request != null ? request.getRemoteAddr() : null;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    auditWriter.insert(userId, action, entityType, entityId, ip);
                }
            });
        } else {
            auditWriter.insert(userId, action, entityType, entityId, ip);
        }
    }
}
