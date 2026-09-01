package com.medifindai.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private boolean active;
    private boolean emailVerified;
    private LocalDateTime createdAt;
}
