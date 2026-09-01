package com.medifindai.service.impl;

import com.medifindai.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Override
    public void sendEmail(String to, String subject, String body) {
        if (smtpUsername == null || smtpUsername.isBlank()) {
            // Demo fallback: SMTP not configured, log instead of crashing.
            log.info("[DEMO MODE - SMTP not configured] Would send email to {} | subject: {} | body: {}",
                    to, subject, body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(smtpUsername);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetLink) {
        String subject = "Reset your MediFindAI password";
        String body = "We received a request to reset your password.\n\n"
                + "Click the link below to set a new password (valid for a limited time):\n"
                + resetLink + "\n\n"
                + "If you did not request this, you can safely ignore this email.";
        sendEmail(to, subject, body);
    }

    @Override
    public void sendWelcomeEmail(String to, String fullName) {
        String subject = "Welcome to MediFindAI";
        String body = "Hi " + fullName + ",\n\n"
                + "Welcome to MediFindAI! Your account has been created successfully.\n"
                + "You can now search medicines, compare prices, and reserve them at nearby pharmacies.";
        sendEmail(to, subject, body);
    }
}
