package com.caagent.repository;

import com.caagent.model.Filing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FilingRepository extends JpaRepository<Filing, UUID> {

    // Explicit JOIN FETCH so f.client is populated in the response instead of coming back
    // null (Filing.client is FetchType.LAZY, and Hibernate6Module serializes uninitialized
    // lazy associations as null rather than throwing - see JacksonConfig). Fetching a
    // to-one association alongside pagination is safe; it's only *-to-many fetch joins
    // that break LIMIT/OFFSET.
    @Query(value = "SELECT f FROM Filing f JOIN FETCH f.client WHERE f.owner.id = :ownerId",
           countQuery = "SELECT COUNT(f) FROM Filing f WHERE f.owner.id = :ownerId")
    Page<Filing> findByOwnerId(@Param("ownerId") UUID ownerId, Pageable pageable);

    @Query(value = "SELECT f FROM Filing f JOIN FETCH f.client WHERE f.owner.id = :ownerId AND f.client.id = :clientId",
           countQuery = "SELECT COUNT(f) FROM Filing f WHERE f.owner.id = :ownerId AND f.client.id = :clientId")
    Page<Filing> findByOwnerIdAndClientId(@Param("ownerId") UUID ownerId, @Param("clientId") UUID clientId, Pageable pageable);

    Optional<Filing> findByIdAndOwnerId(UUID id, UUID ownerId);

    @Query("SELECT f FROM Filing f JOIN FETCH f.client WHERE f.owner.id = :ownerId AND f.dueDate BETWEEN :start AND :end")
    List<Filing> findByOwnerIdAndDueDateBetween(@Param("ownerId") UUID ownerId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    long countByOwnerIdAndStatus(UUID ownerId, Filing.Status status);

    boolean existsByOwnerIdAndClientIdAndFilingTypeAndPeriodLabel(
            UUID ownerId, UUID clientId, Filing.FilingType filingType, String periodLabel);

    List<Filing> findByOwnerIdAndStatusAndDueDateBetween(
            UUID ownerId, Filing.Status status, LocalDate start, LocalDate end);

    // Used by the public read-only status page - deliberately not owner-scoped, since the
    // owner is implied by the client the caller already resolved via a valid share token.
    List<Filing> findByClientIdOrderByDueDateDesc(UUID clientId);

    // Global (not owner-scoped) - used by the daily overdue-check job, which runs across all
    // accounts. JOIN FETCH client/owner so the notification message can be built without N+1s.
    @Query("SELECT f FROM Filing f JOIN FETCH f.client JOIN FETCH f.owner " +
           "WHERE f.status IN :statuses AND f.dueDate < :today")
    List<Filing> findByStatusInAndDueDateBefore(@Param("statuses") List<Filing.Status> statuses, @Param("today") LocalDate today);

    // Unpaginated - used only for CSV export, where the whole list is needed at once.
    @Query("SELECT f FROM Filing f JOIN FETCH f.client WHERE f.owner.id = :ownerId ORDER BY f.dueDate ASC")
    List<Filing> findAllByOwnerIdForExport(@Param("ownerId") UUID ownerId);
}
