package com.medifindai.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String token;

    @NotBlank(message = "New password is required")
    @Pattern(
        regexp = "^[A-Za-z0-9]+$",
        message = "Use letters and numbers to create your password."
    )
    private String newPassword;



}
