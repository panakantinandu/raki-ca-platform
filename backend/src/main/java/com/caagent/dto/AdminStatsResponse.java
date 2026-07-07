package com.caagent.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record AdminStatsResponse(
        long totalSignups,
        long activeTrials,
        Map<String, Long> activeSubscriptionsByPlan,
        List<RecentSignup> recentSignups
) {
    public record RecentSignup(String email, String fullName, Instant createdAt) {}
}
