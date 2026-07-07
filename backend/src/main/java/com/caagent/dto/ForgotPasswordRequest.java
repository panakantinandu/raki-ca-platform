package com.caagent.dto;

import jakarta.validation.constraints.*;

public record ForgotPasswordRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Provide a valid email address")
        @Size(max = 255)
        String email
) {}
