package com.caagent.dto;

import jakarta.validation.constraints.*;

public record ClientRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank String entityType,
        @Pattern(regexp = "^[0-9A-Z]{0,15}$", message = "GSTIN must be alphanumeric") String gstin,
        @Pattern(regexp = "^[A-Z0-9]{0,10}$", message = "PAN must be alphanumeric") String pan,
        @Email @Size(max = 255) String email,
        @Pattern(regexp = "^[0-9+ -]{0,20}$", message = "Invalid phone number") String phone,
        @Size(max = 2000) String notes
) {}
