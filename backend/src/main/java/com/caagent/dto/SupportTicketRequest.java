package com.caagent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportTicketRequest(
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(max = 5000) String message
) {}
