package com.caagent.controller;

import com.caagent.dto.PublicClientStatusResponse;
import com.caagent.service.PublicStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// No auth: this is the public, read-only, share-link surface (see SecurityConfig permitAll
// for /api/public/**). Everything returned here must stay limited to what PublicStatusService
// deliberately exposes - never widen this without re-checking that contract.
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicStatusController {

    private final PublicStatusService publicStatusService;

    @GetMapping("/status/{token}")
    public PublicClientStatusResponse getStatus(@PathVariable String token) {
        return publicStatusService.getStatus(token);
    }
}
