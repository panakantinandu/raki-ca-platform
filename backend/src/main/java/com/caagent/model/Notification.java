package com.caagent.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Polled by the frontend every 15-30s (no WebSockets - see NotificationController). referenceId
 * / referenceType are a loose, non-FK pointer to whatever the notification is about, since one
 * table can't cleanly FK to several different parent tables (filings, tickets, documents).
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Type type;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum Type {
        FILING_OVERDUE,
        RECURRING_FILING_CREATED,
        SUPPORT_TICKET_REPLIED,
        EXTRACTION_COMPLETED,
        EXTRACTION_FAILED
    }
}
