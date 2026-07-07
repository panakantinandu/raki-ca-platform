package com.caagent.service;

import com.caagent.dto.*;
import com.caagent.exception.ApiException;
import com.caagent.model.PasswordResetToken;
import com.caagent.model.RefreshToken;
import com.caagent.model.User;
import com.caagent.repository.PasswordResetTokenRepository;
import com.caagent.repository.RefreshTokenRepository;
import com.caagent.repository.UserRepository;
import com.caagent.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SubscriptionService subscriptionService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;
    private final LoginAttemptService loginAttemptService;
    private final EmailService emailService;

    @Value("${app.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Value("${app.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Transactional
    public AuthResponse register(RegisterRequest req, HttpServletRequest httpRequest) {
        String normalizedEmail = req.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            // Deliberately vague message: don't confirm/deny account existence to an attacker.
            throw ApiException.conflict("Unable to create an account with these details.");
        }

        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName(req.fullName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(req.password()))
                .authProvider(User.AuthProvider.LOCAL)
                .role(User.Role.FIRM_ADMIN)
                .firmName(req.firmName() != null ? req.firmName().trim() : null)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        user = userRepository.save(user);
        subscriptionService.startTrialForUser(user);
        auditService.log(user.getId(), "USER_REGISTERED", "user", user.getId().toString(), httpRequest);

        TokenPair tokens = issueTokensForUser(user, httpRequest);
        return toAuthResponse(tokens, user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req, HttpServletRequest httpRequest) {
        String normalizedEmail = req.email().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password."));

        if (user.getAuthProvider() != User.AuthProvider.LOCAL || user.getPasswordHash() == null) {
            throw ApiException.unauthorized("This account uses Google sign-in. Please continue with Google.");
        }

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw ApiException.unauthorized("Account temporarily locked due to repeated failed attempts. Try again later.");
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            loginAttemptService.registerFailedAttempt(user.getId());
            throw ApiException.unauthorized("Invalid email or password.");
        }

        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been deactivated.");
        }

        // Success: reset failed-attempt counter
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        auditService.log(user.getId(), "USER_LOGIN", "user", user.getId().toString(), httpRequest);

        TokenPair tokens = issueTokensForUser(user, httpRequest);
        return toAuthResponse(tokens, user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest req, HttpServletRequest httpRequest) {
        String hash = jwtUtil.hashToken(req.refreshToken());

        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> ApiException.unauthorized("Invalid or expired refresh token."));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("Refresh token expired. Please log in again.");
        }

        // Rotate: revoke the old refresh token and issue a brand new pair.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        TokenPair tokens = issueTokensForUser(user, httpRequest);
        return toAuthResponse(tokens, user);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    /**
     * Always completes normally whether or not the email belongs to an account - the
     * controller returns 200 either way, so an attacker can't use this endpoint to
     * enumerate registered emails.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            // Google-only accounts have no local password to reset.
            if (user.getAuthProvider() != User.AuthProvider.LOCAL) {
                return;
            }

            passwordResetTokenRepository.invalidateAllForUser(user.getId());

            String rawToken = jwtUtil.generateOpaqueRefreshToken();
            PasswordResetToken tokenEntity = PasswordResetToken.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .tokenHash(jwtUtil.hashToken(rawToken))
                    .expiresAt(Instant.now().plus(PASSWORD_RESET_TOKEN_EXPIRY_HOURS, ChronoUnit.HOURS))
                    .build();
            passwordResetTokenRepository.save(tokenEntity);

            String resetLink = frontendBaseUrl + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String hash = jwtUtil.hashToken(req.token());

        PasswordResetToken stored = passwordResetTokenRepository.findByTokenHashAndUsedFalse(hash)
                .orElseThrow(() -> ApiException.badRequest("This reset link is invalid or has already been used."));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("This reset link has expired. Please request a new one.");
        }

        User user = stored.getUser();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        stored.setUsed(true);
        passwordResetTokenRepository.save(stored);

        // A password reset should invalidate any session started with the old password.
        refreshTokenRepository.deleteAllByUserId(user.getId());
    }

    @Transactional
    public TokenPair issueTokensForUser(User user, HttpServletRequest httpRequest) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String rawRefresh = jwtUtil.generateOpaqueRefreshToken();

        RefreshToken tokenEntity = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(user)
                .tokenHash(jwtUtil.hashToken(rawRefresh))
                .expiresAt(Instant.now().plus(refreshTokenExpiryMs, ChronoUnit.MILLIS))
                .userAgent(httpRequest != null ? truncate(httpRequest.getHeader("User-Agent"), 255) : null)
                .ipAddress(httpRequest != null ? httpRequest.getRemoteAddr() : null)
                .build();
        refreshTokenRepository.save(tokenEntity);

        return new TokenPair(accessToken, rawRefresh, accessTokenExpiryMs / 1000);
    }

    private AuthResponse toAuthResponse(TokenPair tokens, User user) {
        return new AuthResponse(
                tokens.accessToken(),
                tokens.refreshToken(),
                "Bearer",
                tokens.expiresInSeconds(),
                new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name(), user.getFirmName())
        );
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
