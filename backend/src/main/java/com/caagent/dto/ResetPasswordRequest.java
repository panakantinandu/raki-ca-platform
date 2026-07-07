package com.caagent.dto;

import jakarta.validation.constraints.*;

public record ResetPasswordRequest(
        @NotBlank(message = "Reset token is required")
        String token,

        // Same strength rule as registration: 8+ chars, upper, lower, digit, special char.
        @NotBlank(message = "New password is required")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=-]).{8,72}$",
            message = "Password must be 8+ characters and include an uppercase letter, a lowercase letter, a number, and a special character"
        )
        String newPassword
) {}
