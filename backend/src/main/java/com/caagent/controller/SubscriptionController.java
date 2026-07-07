package com.caagent.controller;

import com.caagent.dto.SubscriptionResponse;
import com.caagent.security.UserPrincipal;
import com.caagent.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/me")
    public SubscriptionResponse getMySubscription(@AuthenticationPrincipal UserPrincipal principal) {
        return SubscriptionResponse.from(subscriptionService.getCurrentSubscription(principal.getUserId()));
    }

    @PostMapping("/change-plan")
    public SubscriptionResponse changePlan(@AuthenticationPrincipal UserPrincipal principal, @RequestParam String planCode) {
        return SubscriptionResponse.from(subscriptionService.requestPlanChange(principal.getUserId(), planCode));
    }
}
