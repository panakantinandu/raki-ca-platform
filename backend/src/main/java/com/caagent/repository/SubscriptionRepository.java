package com.caagent.repository;

import com.caagent.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    @Query("SELECT s FROM Subscription s JOIN FETCH s.plan WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    Optional<Subscription> findFirstByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    long countByStatus(Subscription.Status status);

    @Query("SELECT p.code, COUNT(s) FROM Subscription s JOIN s.plan p WHERE s.status = 'ACTIVE' GROUP BY p.code")
    List<Object[]> countActiveByPlan();
}
