package com.caagent.repository;

import com.caagent.model.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {
    // Pageable + owner-scoped queries. Hibernate parameterizes these automatically -
    // no raw SQL string concatenation happens anywhere in this codebase.
    Page<Client> findByOwnerId(UUID ownerId, Pageable pageable);
    Optional<Client> findByIdAndOwnerId(UUID id, UUID ownerId);
    long countByOwnerId(UUID ownerId);

    // Unpaginated - used only for CSV export, where the whole list is needed at once.
    List<Client> findByOwnerIdOrderByNameAsc(UUID ownerId);

    // shareEnabled is part of the query itself (not checked after loading) so a disabled
    // token and a token that never existed take the exact same code path to "not found".
    Optional<Client> findByShareTokenAndShareEnabledTrue(String shareToken);

    boolean existsByShareToken(String shareToken);
}
