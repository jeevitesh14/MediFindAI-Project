package com.medifindai.service;

import com.medifindai.dto.auth.RegisterRequest;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.DuplicateResourceException;
import com.medifindai.repository.PasswordResetTokenRepository;
import com.medifindai.repository.PharmacyRepository;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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
    void register_shouldCreateUser_whenEmailAndPhoneValid() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("test@example.com");
        request.setPhone("9876543210");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("9876543210")).thenReturn(false);
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
        assertThat(response.getUser().getPhone()).isEqualTo("9876543210");
        assertThat(response.getUser().getRole()).isEqualTo(Role.USER.name());
        verify(emailService).sendWelcomeEmail("test@example.com", "Test User");
    }

    @Test
    void register_shouldThrow_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("existing@example.com");
        request.setPhone("9876543210");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenPhoneIsNull() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("newuser@example.com");
        request.setPhone(null);
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Phone number is required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenPhoneIsBlank() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("newuser@example.com");
        request.setPhone("   ");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Phone number is required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenPhoneIsMalformed() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("newuser@example.com");
        request.setPhone("12345");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Phone must be a valid 10-digit mobile number");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenPhoneAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("unique@example.com");
        request.setPhone("9876543210");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("unique@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("9876543210")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("phone number already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldNormalizePhoneWithPrefix_andSave10Digits() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("User Prefix");
        request.setEmail("prefix@example.com");
        request.setPhone("+91 9876543210");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail("prefix@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("9876543210")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(15L);
            return u;
        });
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("prefix-token");

        var response = authService.register(request);

        assertThat(response.getUser().getPhone()).isEqualTo("9876543210");
        verify(userRepository).save(argThat(user -> "9876543210".equals(user.getPhone())));
    }

    @Test
    void register_shouldNeverAllowSelfAssignedAdminRole() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Sneaky User");
        request.setEmail("sneaky@example.com");
        request.setPhone("9876543211");
        request.setPassword("Password@123");
        request.setRole(Role.ADMIN);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone("9876543211")).thenReturn(false);
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
        request.setPhone("9876543212");
        request.setPassword("dadi123");

        when(userRepository.existsByEmail("dadi@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("9876543212")).thenReturn(false);
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
        assertThat(response.getUser().getPhone()).isEqualTo("9876543212");
        verify(passwordEncoder).encode("dadi123");
    }

    @Test
    void register_shouldCreatePharmacy_whenPharmacyOwnerRole() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Suresh Reddy");
        request.setEmail("suresh.owner@example.com");
        request.setPhone("9876543213");
        request.setPassword("pharmacy123");
        request.setRole(Role.PHARMACY_OWNER);

        when(userRepository.existsByEmail("suresh.owner@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("9876543213")).thenReturn(false);
        when(passwordEncoder.encode("pharmacy123")).thenReturn("hashed-pharmacy123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(4L);
            return u;
        });
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("owner-token");

        var response = authService.register(request);

        assertThat(response.getUser().getRole()).isEqualTo(Role.PHARMACY_OWNER.name());
        assertThat(response.getUser().getPhone()).isEqualTo("9876543213");
        verify(pharmacyRepository).save(any(com.medifindai.entity.Pharmacy.class));
    }
}
