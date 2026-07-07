package com.caagent.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Stand-in EmailService until a real provider is configured: logs the reset link instead
 * of sending it. Replace with a real sender by implementing EmailService and marking
 * this @Service @ConditionalOnMissingBean, or just deleting this class and swapping it in.
 */
@Service
@Slf4j
public class ConsoleEmailService implements EmailService {

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        log.info("=== PASSWORD RESET EMAIL (no email provider configured - logging instead) ===\n" +
                        "To: {}\nReset link: {}\n" +
                        "===============================================================",
                toEmail, resetLink);
    }
}
