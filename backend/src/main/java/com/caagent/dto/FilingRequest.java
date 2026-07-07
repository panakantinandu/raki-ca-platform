package com.caagent.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public record FilingRequest(
        @NotNull UUID clientId,
        @NotBlank String filingType,
        @NotBlank @Size(max = 30) String periodLabel,
        @NotNull LocalDate dueDate,
        @Size(max = 2000) String notes
) {}
