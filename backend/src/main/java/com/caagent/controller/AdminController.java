package com.caagent.controller;

import com.caagent.dto.AdminStatsResponse;
import com.caagent.security.UserPrincipal;
import com.caagent.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public AdminStatsResponse getStats(@AuthenticationPrincipal UserPrincipal principal) {
        adminService.assertIsAdmin(principal.getUserId());
        return adminService.getStats();
    }
}
