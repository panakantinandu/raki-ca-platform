package com.caagent.service;

import com.caagent.dto.AdminStatsResponse;
import com.caagent.exception.ApiException;
import com.caagent.model.Subscription;
import com.caagent.repository.SubscriptionRepository;
import com.caagent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Backs the founder-only /app/admin visibility page. This is deliberately NOT a role
 * system - just one hard-coded user id from config - since there's exactly one person
 * who needs this today. Revisit with a real ADMIN role if that ever changes.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Value("${app.admin.user-id:}")
    private String adminUserId;

    public void assertIsAdmin(UUID userId) {
        if (adminUserId == null || adminUserId.isBlank() || !adminUserId.equals(userId.toString())) {
            throw ApiException.forbidden("You don't have permission to view this page.");
        }
    }

    public AdminStatsResponse getStats() {
        long totalSignups = userRepository.count();
        long activeTrials = subscriptionRepository.countByStatus(Subscription.Status.TRIALING);

        Map<String, Long> activeByPlan = new LinkedHashMap<>();
        for (Object[] row : subscriptionRepository.countActiveByPlan()) {
            activeByPlan.put((String) row[0], (Long) row[1]);
        }

        var recentSignups = userRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(u -> new AdminStatsResponse.RecentSignup(u.getEmail(), u.getFullName(), u.getCreatedAt()))
                .toList();

        return new AdminStatsResponse(totalSignups, activeTrials, activeByPlan, recentSignups);
    }
}
