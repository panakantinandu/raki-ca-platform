package com.caagent.security;

import lombok.Getter;

import java.util.UUID;

/** Lightweight principal built straight from JWT claims - no DB hit needed per request. */
@Getter
public class UserPrincipal {

    private final UUID userId;
    private final String email;
    private final String role;

    public UserPrincipal(UUID userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }
}
