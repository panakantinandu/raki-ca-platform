package com.caagent.dto;

import com.caagent.model.Plan;
import com.caagent.model.Subscription;

import java.time.Instant;
import java.util.UUID;

/**
 * Flattens Subscription + its Plan into a single response so the frontend never has to deal
 * with the lazy-loaded plan association coming back null (see Subscription.plan, which is
 * FetchType.LAZY and gets serialized as null by Hibernate6Module once the session is closed).
 */
public record SubscriptionResponse(
        UUID id,
        String status,
        String planCode,
        String planName,
        int priceInrMonthly,
        Integer foundingPriceInrMonthly,
        Integer foundingSlotsRemaining,
        boolean foundingActive,
        Integer maxClients,
        int maxSeats,
        Instant currentPeriodStart,
        Instant currentPeriodEnd,
        Instant trialEndsAt,
        boolean cancelAtPeriodEnd
) {
    public static SubscriptionResponse from(Subscription subscription) {
        Plan plan = subscription.getPlan();
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getStatus().name(),
                plan.getCode(),
                plan.getName(),
                plan.getPriceInrMonthly(),
                plan.getFoundingPriceInrMonthly(),
                plan.getFoundingSlotsRemaining(),
                plan.isFoundingActive(),
                plan.getMaxClients(),
                plan.getMaxSeats(),
                subscription.getCurrentPeriodStart(),
                subscription.getCurrentPeriodEnd(),
                subscription.getTrialEndsAt(),
                subscription.isCancelAtPeriodEnd()
        );
    }
}
