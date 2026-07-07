package com.caagent.service;

import com.caagent.model.User;
import com.caagent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Records failed login attempts in a transaction independent of the caller's.
 *
 * AuthService.login() throws (and thus rolls back) on a bad password, which would
 * otherwise undo the failed-attempt counter increment along with it. Running this
 * in REQUIRES_NEW - via a separate bean, so the @Transactional proxy is actually
 * invoked instead of bypassed by self-invocation - makes the counter durable
 * regardless of what the caller does afterward.
 */
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registerFailedAttempt(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        int attempts = user.getFailedLoginCount() + 1;
        user.setFailedLoginCount(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(Instant.now().plus(LOCKOUT_MINUTES, ChronoUnit.MINUTES));
        }
        userRepository.save(user);
    }
}
