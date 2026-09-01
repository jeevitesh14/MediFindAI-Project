package com.medifindai.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private boolean emailVerified;
    private String profileImageUrl;
}
