package com.caagent.repository;

import com.caagent.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
    List<Plan> findByActiveTrueOrderBySortOrderAsc();
    Optional<Plan> findByCode(String code);

    // Conditional on remaining > 0 so concurrent claims can't push the count negative;
    // returns the number of rows updated (0 if no slots were left) so the caller knows
    // whether its claim actually succeeded.
    @Modifying
    @Query("UPDATE Plan p SET p.foundingSlotsRemaining = p.foundingSlotsRemaining - 1 " +
           "WHERE p.id = :planId AND p.foundingSlotsRemaining > 0")
    int claimFoundingSlot(@Param("planId") UUID planId);
}
