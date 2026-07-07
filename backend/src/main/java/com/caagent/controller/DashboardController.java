package com.caagent.controller;

import com.caagent.security.UserPrincipal;
import com.caagent.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardService.DashboardStats getStats(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.getStats(principal.getUserId());
    }
}
