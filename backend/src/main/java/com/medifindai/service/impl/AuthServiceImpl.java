package com.medifindai.service.impl;

import com.medifindai.dto.auth.*;
import com.medifindai.entity.PasswordResetToken;
import com.medifindai.entity.RefreshToken;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.DuplicateResourceException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.exception.UnauthorizedException;
import com.medifindai.repository.PasswordResetTokenRepository;
import com.medifindai.repository.PharmacyRepository;
import com.medifindai.repository.RefreshTokenRepository;
import com.medifindai.repository.UserRepository;

import com.medifindai.security.JwtTokenProvider;
import com.medifindai.service.AuthService;
import com.medifindai.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PharmacyRepository pharmacyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final com.medifindai.service.NotificationService notificationService;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        if (request.getPhone() == null || request.getPhone().trim().isBlank()) {
            throw new BadRequestException("Phone number is required");
        }

        String normalizedPhone = normalizePhoneNumber(request.getPhone());
        if (!normalizedPhone.matches("^[0-9]{10}$")) {
            throw new BadRequestException("Phone must be a valid 10-digit mobile number");
        }

        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new DuplicateResourceException("An account with this phone number already exists");
        }

        // ADMIN role can never be self-assigned during public registration.
        Role role = (request.getRole() == null || request.getRole() == Role.ADMIN)
                ? Role.USER
                : request.getRole();

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(normalizedPhone)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);

        // If registered as PHARMACY_OWNER, auto-provision initial Pharmacy profile
        if (role == Role.PHARMACY_OWNER && pharmacyRepository != null) {
            String licenseNum = "LIC-TS-" + Math.abs(10000 + (user.getId().hashCode() % 90000));
            if (pharmacyRepository.existsByLicenseNumber(licenseNum)) {
                licenseNum = "LIC-TS-" + (System.currentTimeMillis() % 1000000);
            }
            com.medifindai.entity.Pharmacy initialPharmacy = com.medifindai.entity.Pharmacy.builder()
                    .owner(user)
                    .name(user.getFullName() + "'s Pharmacy")
                    .licenseNumber(licenseNum)
                    .description("Registered community healthcare pharmacy store.")
                    .addressLine("Main Road")
                    .city("Hyderabad")
                    .state("Telangana")
                    .postalCode("500001")
                    .phone(user.getPhone() != null && !user.getPhone().isBlank() ? user.getPhone() : "9876543210")
                    .email(user.getEmail())
                    .latitude(17.385044)
                    .longitude(78.486671)
                    .openingTime(java.time.LocalTime.of(8, 0))
                    .closingTime(java.time.LocalTime.of(22, 0))
                    .is24Hours(false)
                    .verificationStatus(com.medifindai.entity.Pharmacy.VerificationStatus.VERIFIED)
                    .active(true)
                    .rating(4.5)
                    .build();
            pharmacyRepository.save(initialPharmacy);
            log.info("Auto-provisioned initial pharmacy for newly registered owner {}", user.getEmail());

            if (notificationService != null) {
                notificationService.sendNotificationToAdmins(
                        "New Pharmacy Partner Registered",
                        user.getFullName() + " registered a new pharmacy (" + initialPharmacy.getName() + ", License: " + licenseNum + ").",
                        com.medifindai.entity.Notification.Type.SYSTEM,
                        initialPharmacy.getId(),
                        "/admin/pharmacies"
                );
            }
        }

        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

        log.info("New user registered: {} ({})", user.getEmail(), user.getRole());
        return buildAuthResponse(user);
    }



    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isActive()) {
            throw new UnauthorizedException("This account has been deactivated. Contact support.");
        }

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        User user = stored.getUser();
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(token)
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String resetLink = "https://app.medifindai.com/reset-password?token=" + token;
            emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        });
        // Always respond as if successful, regardless of whether the email exists,
        // to avoid leaking which emails are registered.
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.deleteByUserId(user.getId());
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        String refreshTokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .user(AuthResponse.UserSummary.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole().name())
                        .build())
                .build();
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) {
            return "";
        }
        String clean = phone.replaceAll("[\\s\\-()]", "");
        if (clean.startsWith("+91")) {
            clean = clean.substring(3);
        } else if (clean.startsWith("91") && clean.length() == 12) {
            clean = clean.substring(2);
        } else if (clean.startsWith("0") && clean.length() == 11) {
            clean = clean.substring(1);
        }
        return clean;
    }
}
