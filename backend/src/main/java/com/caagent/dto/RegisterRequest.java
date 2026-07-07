package com.caagent.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
        @Pattern(regexp = "^[\\p{L} .,'-]+$", message = "Full name contains invalid characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Provide a valid email address")
        @Size(max = 255)
        String email,

        // Enforced strength: 8+ chars, upper, lower, digit, special char.
        @NotBlank(message = "Password is required")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=-]).{8,72}$",
            message = "Password must be 8+ characters and include an uppercase letter, a lowercase letter, a number, and a special character"
        )
        String password,

        @Size(max = 200)
        String firmName
) {}
