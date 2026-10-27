package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.common.UserProfileDto;
import com.medifindai.entity.User;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.UserRepository;
import com.medifindai.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ApiResponse<UserProfileDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserProfileDto dto = UserProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .emailVerified(user.isEmailVerified())
                .profileImageUrl(user.getProfileImageUrl())
                .build();

        return ApiResponse.success(dto);
    }

    @org.springframework.web.bind.annotation.PutMapping("/me")
    public ApiResponse<UserProfileDto> updateCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.medifindai.dto.common.UpdateUserProfileRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String rawPhone = request.getPhone() != null ? request.getPhone().trim() : "";
        String normalizedPhone = rawPhone.replaceAll("[\\s\\-()]", "");
        if (normalizedPhone.startsWith("+91")) {
            normalizedPhone = normalizedPhone.substring(3);
        } else if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
            normalizedPhone = normalizedPhone.substring(2);
        } else if (normalizedPhone.startsWith("0") && normalizedPhone.length() == 11) {
            normalizedPhone = normalizedPhone.substring(1);
        }

        if (!normalizedPhone.matches("^[0-9]{10}$")) {
            throw new com.medifindai.exception.BadRequestException("Phone must be a valid 10-digit mobile number");
        }

        // Prevent taking a phone number already used by a different user
        userRepository.findByPhone(normalizedPhone).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new com.medifindai.exception.DuplicateResourceException("An account with this phone number already exists");
            }
        });

        if (request.getFullName() != null && !request.getFullName().trim().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        user.setPhone(normalizedPhone);
        User saved = userRepository.save(user);

        UserProfileDto dto = UserProfileDto.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .role(saved.getRole().name())
                .emailVerified(saved.isEmailVerified())
                .profileImageUrl(saved.getProfileImageUrl())
                .build();

        return ApiResponse.success(dto);
    }
}
