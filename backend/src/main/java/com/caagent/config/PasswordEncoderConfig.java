package com.caagent.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Kept separate from {@link SecurityConfig}: AuthService depends on PasswordEncoder, and
 * SecurityConfig depends (transitively, via OAuth2LoginSuccessHandler) on AuthService - declaring
 * this bean inside SecurityConfig would form a circular dependency.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Strength 12: deliberately higher than BCrypt's default of 10 for extra brute-force resistance.
        return new BCryptPasswordEncoder(12);
    }
}
