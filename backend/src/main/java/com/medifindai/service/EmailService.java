package com.medifindai.service;

public interface EmailService {

    /**
     * Sends an email. Implementations must fail gracefully (log + no-op) if SMTP
     * credentials are not configured, so the app never crashes because of missing config.
     */
    void sendEmail(String to, String subject, String body);

    void sendPasswordResetEmail(String to, String resetLink);

    void sendWelcomeEmail(String to, String fullName);
}
