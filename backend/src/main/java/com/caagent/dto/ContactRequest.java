package com.caagent.dto;

import jakarta.validation.constraints.*;

public record ContactRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 5000) String message
) {}
