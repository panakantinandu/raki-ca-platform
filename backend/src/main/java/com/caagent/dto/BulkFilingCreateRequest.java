package com.caagent.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BulkFilingCreateRequest(
        @NotEmpty List<UUID> clientIds,
        @NotBlank String filingType,
        @NotBlank @Size(max = 30) String periodLabel,
        @NotNull LocalDate dueDate,
        @Size(max = 2000) String notes
) {}
