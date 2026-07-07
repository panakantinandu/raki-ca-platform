package com.caagent.repository;

import com.caagent.model.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    Page<Document> findByOwnerId(UUID ownerId, Pageable pageable);
    Page<Document> findByOwnerIdAndClientId(UUID ownerId, UUID clientId, Pageable pageable);
    Optional<Document> findByIdAndOwnerId(UUID id, UUID ownerId);
}
