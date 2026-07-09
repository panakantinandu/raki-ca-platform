package com.caagent.controller;

import com.caagent.dto.SupportChatRequest;
import com.caagent.security.UserPrincipal;
import com.caagent.service.SupportChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support/chat")
@RequiredArgsConstructor
public class SupportChatController {

    private final SupportChatService supportChatService;

    @PostMapping
    public SupportChatService.ChatResult ask(@AuthenticationPrincipal UserPrincipal principal,
                                              @Valid @RequestBody SupportChatRequest req) {
        return supportChatService.ask(principal.getUserId(), req.question());
    }
}
