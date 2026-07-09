package com.caagent.repository;

import com.caagent.model.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    Page<SupportTicket> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);
    Page<SupportTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Optional<SupportTicket> findByIdAndOwnerId(UUID id, UUID ownerId);
}
