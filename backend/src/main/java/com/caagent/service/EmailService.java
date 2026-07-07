package com.caagent.service;

/**
 * Swap ConsoleEmailService for a real implementation (SES/SendGrid/Postmark/etc.) when
 * an email provider is wired in - nothing else in the codebase needs to change since
 * everything calls this interface, not a concrete sender.
 */
public interface EmailService {
    void sendPasswordResetEmail(String toEmail, String resetLink);
}
