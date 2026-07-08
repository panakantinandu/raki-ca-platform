package com.caagent.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record FilingTemplateRequest(
        @NotNull UUID clientId,
        @NotBlank String filingType,
        @Min(1) @Max(31) int dayOfMonthDue
) {}
