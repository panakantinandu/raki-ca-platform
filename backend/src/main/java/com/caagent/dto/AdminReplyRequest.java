package com.caagent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminReplyRequest(
        @NotBlank @Size(max = 5000) String reply
) {}
