package com.medifindai.service;

import com.medifindai.dto.auth.RegisterRequest;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.exception.DuplicateResourceException;
import com.medifindai.repository.PasswordResetTokenRepository;
import com.medifindai.repository.RefreshTokenRepository;
import com.medifindai.repository.UserRepository;
import com.medifindai.security.JwtTokenProvider;
import com.medifindai.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import com.medifindai.repository.PharmacyRepository;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PharmacyRepository pharmacyRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;


    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604800000L);
    }

    @Test
    void register_shouldCreateUser_whenEmailNotTaken() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("test@example.com");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("access-token");

        var response = authService.register(request);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        assertThat(response.getUser().getRole()).isEqualTo(Role.USER.name());
        verify(emailService).sendWelcomeEmail("test@example.com", "Test User");
    }

    @Test
    void register_shouldThrow_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("existing@example.com");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldNeverAllowSelfAssignedAdminRole() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Sneaky User");
        request.setEmail("sneaky@example.com");
        request.setPassword("Password@123");
        request.setRole(Role.ADMIN);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("access-token");

        var response = authService.register(request);

        assertThat(response.getUser().getRole()).isEqualTo(Role.USER.name());
    }

    @Test
    void register_shouldSucceedWithSimpleAlphanumericPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Dadi Jeevitesh");
        request.setEmail("dadi@example.com");
        request.setPassword("dadi123");

        when(userRepository.existsByEmail("dadi@example.com")).thenReturn(false);
        when(passwordEncoder.encode("dadi123")).thenReturn("hashed-dadi123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("dadi-token");

        var response = authService.register(request);

        assertThat(response.getAccessToken()).isEqualTo("dadi-token");
        assertThat(response.getUser().getEmail()).isEqualTo("dadi@example.com");
        verify(passwordEncoder).encode("dadi123");
    }

    @Test
    void register_shouldCreatePharmacy_whenPharmacyOwnerRole() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Suresh Reddy");
        request.setEmail("suresh.owner@example.com");
        request.setPassword("pharmacy123");
        request.setRole(Role.PHARMACY_OWNER);

        when(userRepository.existsByEmail("suresh.owner@example.com")).thenReturn(false);
        when(passwordEncoder.encode("pharmacy123")).thenReturn("hashed-pharmacy123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(4L);
            return u;
        });
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("owner-token");

        var response = authService.register(request);

        assertThat(response.getUser().getRole()).isEqualTo(Role.PHARMACY_OWNER.name());
        verify(pharmacyRepository).save(any(com.medifindai.entity.Pharmacy.class));
    }
}

