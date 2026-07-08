package com.caagent.repository;

import com.caagent.model.DocumentExtractionCall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface DocumentExtractionCallRepository extends JpaRepository<DocumentExtractionCall, UUID> {
    long countByOwnerIdAndCreatedAtAfter(UUID ownerId, Instant after);
}
