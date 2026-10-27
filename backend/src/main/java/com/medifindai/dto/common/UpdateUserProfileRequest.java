package com.medifindai.dto.common;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {

    @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^(\\+91[\\-\\s]?)?[0-9]{10}$",
        message = "Phone must be a valid 10-digit mobile number"
    )
    private String phone;
}
