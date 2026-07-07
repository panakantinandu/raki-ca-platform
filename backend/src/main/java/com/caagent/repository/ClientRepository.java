package com.caagent.repository;

import com.caagent.model.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {
    // Pageable + owner-scoped queries. Hibernate parameterizes these automatically -
    // no raw SQL string concatenation happens anywhere in this codebase.
    Page<Client> findByOwnerId(UUID ownerId, Pageable pageable);
    Optional<Client> findByIdAndOwnerId(UUID id, UUID ownerId);
    long countByOwnerId(UUID ownerId);
}
