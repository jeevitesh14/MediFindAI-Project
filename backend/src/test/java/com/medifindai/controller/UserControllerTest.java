package com.medifindai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medifindai.dto.common.UpdateUserProfileRequest;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.repository.UserRepository;
import com.medifindai.security.JwtTokenProvider;
import com.medifindai.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    private User testUser;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(100L)
                .fullName("Test Customer")
                .email("customer@example.com")
                .phone("9876543210")
                .passwordHash("hash")
                .role(Role.USER)
                .active(true)
                .emailVerified(true)
                .build();

        principal = new UserPrincipal(testUser);
    }

    @Test
    void getCurrentUser_shouldReturnProfile_whenAuthenticated() throws Exception {
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));

        mockMvc.perform(get("/users/me")
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("customer@example.com"))
                .andExpect(jsonPath("$.data.phone").value("9876543210"));
    }

    @Test
    void updateCurrentUser_shouldUpdatePhoneSuccessfully() throws Exception {
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(userRepository.findByPhone("9123456789")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserProfileRequest updateRequest = UpdateUserProfileRequest.builder()
                .fullName("Test Customer Updated")
                .phone("+91 9123456789")
                .build();

        mockMvc.perform(put("/users/me")
                        .with(user(principal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Test Customer Updated"))
                .andExpect(jsonPath("$.data.phone").value("9123456789"));

        verify(userRepository).save(argThat(u -> "9123456789".equals(u.getPhone())));
    }

    @Test
    void updateCurrentUser_shouldThrowConflict_whenPhoneTakenByOtherUser() throws Exception {
        User otherUser = User.builder()
                .id(200L)
                .email("other@example.com")
                .phone("9123456789")
                .build();

        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(userRepository.findByPhone("9123456789")).thenReturn(Optional.of(otherUser));

        UpdateUserProfileRequest updateRequest = UpdateUserProfileRequest.builder()
                .phone("9123456789")
                .build();

        mockMvc.perform(put("/users/me")
                        .with(user(principal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict());

        verify(userRepository, never()).save(any());
    }
}
