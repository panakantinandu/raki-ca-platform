package com.caagent.repository;

import com.caagent.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // Unread-first: "read_at IS NULL" evaluates to true/false, and ORDER BY ... DESC puts
    // true (unread) rows before false (read) ones - then newest-first within each group.
    // Plain JPQL/derived-method sorting can't express "nulls first" portably, hence native SQL.
    @Query(value = "SELECT * FROM notifications WHERE user_id = :ownerId " +
                   "ORDER BY (read_at IS NULL) DESC, created_at DESC",
           countQuery = "SELECT COUNT(*) FROM notifications WHERE user_id = :ownerId",
           nativeQuery = true)
    Page<Notification> findByOwnerIdUnreadFirst(@Param("ownerId") UUID ownerId, Pageable pageable);

    long countByOwnerIdAndReadAtIsNull(UUID ownerId);

    Optional<Notification> findByIdAndOwnerId(UUID id, UUID ownerId);
}
