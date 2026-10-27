package com.medifindai.dto.auth;

import com.medifindai.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 120)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^(\\+91[\\-\\s]?)?[0-9]{10}$",
        message = "Phone must be a valid 10-digit mobile number"
    )
    private String phone;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^[A-Za-z0-9]+$",
        message = "Use letters and numbers to create your password."
    )
    private String password;




    /** Defaults to USER if not provided; ADMIN cannot be self-assigned (enforced in service). */
    private Role role;
}
