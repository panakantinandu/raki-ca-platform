package com.caagent.controller;

import com.caagent.model.Plan;
import com.caagent.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public List<Plan> listPlans() {
        return subscriptionService.listActivePlans();
    }
}
