package com.caagent.repository;

import com.caagent.model.FilingTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FilingTemplateRepository extends JpaRepository<FilingTemplate, UUID> {

    @Query("SELECT t FROM FilingTemplate t JOIN FETCH t.client WHERE t.owner.id = :ownerId AND t.client.id = :clientId")
    List<FilingTemplate> findByOwnerIdAndClientId(@Param("ownerId") UUID ownerId, @Param("clientId") UUID clientId);

    Optional<FilingTemplate> findByIdAndOwnerId(UUID id, UUID ownerId);

    @Query("SELECT t FROM FilingTemplate t JOIN FETCH t.client JOIN FETCH t.owner WHERE t.active = true")
    List<FilingTemplate> findAllActive();
}
