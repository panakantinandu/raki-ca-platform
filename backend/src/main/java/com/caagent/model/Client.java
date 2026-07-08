package com.caagent.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    @Builder.Default
    private EntityType entityType = EntityType.INDIVIDUAL;

    @Column(length = 20)
    private String gstin;

    @Column(length = 15)
    private String pan;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(columnDefinition = "text")
    private String notes;

    // Long random unguessable string (never the client's UUID) used for the public
    // read-only status link at /status/:token. Null until first enabled.
    @Column(name = "share_token", unique = true, length = 64)
    private String shareToken;

    @Column(name = "share_enabled", nullable = false)
    @Builder.Default
    private boolean shareEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum EntityType { INDIVIDUAL, PROPRIETORSHIP, PARTNERSHIP, COMPANY, LLP }
    public enum Status { ACTIVE, INACTIVE }
}
