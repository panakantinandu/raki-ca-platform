package com.caagent.service;

import com.caagent.exception.ApiException;
import com.caagent.model.Plan;
import com.caagent.model.Subscription;
import com.caagent.model.User;
import com.caagent.repository.PlanRepository;
import com.caagent.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private static final int TRIAL_DAYS = 14;

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;

    public List<Plan> listActivePlans() {
        return planRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    @Transactional
    public Subscription startTrialForUser(User user) {
        Plan defaultPlan = planRepository.findByCode("SOLO")
                .orElseThrow(() -> ApiException.notFound("Default plan not configured."));

        Subscription subscription = Subscription.builder()
                .id(UUID.randomUUID())
                .user(user)
                .plan(defaultPlan)
                .status(Subscription.Status.TRIALING)
                .trialEndsAt(Instant.now().plus(TRIAL_DAYS, ChronoUnit.DAYS))
                .currentPeriodStart(Instant.now())
                .currentPeriodEnd(Instant.now().plus(TRIAL_DAYS, ChronoUnit.DAYS))
                .build();

        return subscriptionRepository.save(subscription);
    }

    public Subscription getCurrentSubscription(UUID userId) {
        return subscriptionRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> ApiException.notFound("No subscription found for this account."));
    }

    /**
     * Initiates an upgrade. In production this creates a Razorpay subscription
     * and returns a checkout URL/order id for the frontend to open; the actual
     * plan change is confirmed via the Razorpay webhook handler once payment
     * succeeds (see PaymentController), never trusted purely from the client.
     */
    @Transactional
    public Subscription requestPlanChange(UUID userId, String newPlanCode) {
        Subscription subscription = getCurrentSubscription(userId);

        // No-op if they're already on this plan - don't restart the billing period
        // just because the frontend re-sent the same plan code.
        if (subscription.getPlan().getCode().equals(newPlanCode)) {
            return subscription;
        }

        Plan newPlan = planRepository.findByCode(newPlanCode)
                .orElseThrow(() -> ApiException.notFound("Plan not found: " + newPlanCode));

        // For the trial/demo flow we apply the change immediately.
        // Swap this block for "pending payment" state once Razorpay is wired in.
        subscription.setPlan(newPlan);
        subscription.setStatus(Subscription.Status.ACTIVE);
        subscription.setCurrentPeriodStart(Instant.now());
        subscription.setCurrentPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));

        // Claim a founding-price slot for the plan being chosen, if any are left. Tied to an
        // actual plan selection (not the default trial signup) so the "founding member" claim
        // reflects real commitment, not just registering an account.
        if (planRepository.claimFoundingSlot(newPlan.getId()) > 0) {
            newPlan.setFoundingSlotsRemaining(newPlan.getFoundingSlotsRemaining() - 1);
        }

        return subscriptionRepository.save(subscription);
    }
}
