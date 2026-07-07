package com.caagent.dto;

import java.util.UUID;

public record UserSummary(
        UUID id,
        String fullName,
        String email,
        String role,
        String firmName
) {}
