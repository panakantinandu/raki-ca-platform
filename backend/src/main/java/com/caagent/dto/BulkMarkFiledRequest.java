package com.caagent.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BulkMarkFiledRequest(
        @NotEmpty List<UUID> filingIds
) {}
