package com.medifindai.dto.admin;

import com.medifindai.entity.Pharmacy;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePharmacyAdminRequest {

    @NotBlank(message = "Pharmacy name is required")
    @Size(min = 2, max = 150, message = "Pharmacy name must be between 2 and 150 characters")
    private String name;

    @NotBlank(message = "Pharmacy license/registration number is required")
    @Size(min = 3, max = 100, message = "License number must be between 3 and 100 characters")
    private String licenseNumber;

    @NotNull(message = "Pharmacy owner must be assigned")
    private Long ownerId;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotBlank(message = "Address line is required")
    @Size(max = 255, message = "Address line must not exceed 255 characters")
    private String addressLine;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Size(max = 20, message = "Postal code must not exceed 20 characters")
    private String postalCode;

    @NotNull(message = "Latitude coordinate is required")
    private Double latitude;

    @NotNull(message = "Longitude coordinate is required")
    private Double longitude;

    @NotBlank(message = "Contact phone number is required")
    @Size(min = 7, max = 20, message = "Phone number must be between 7 and 20 digits")
    private String phone;

    @Email(message = "Must be a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    private LocalTime openingTime;

    private LocalTime closingTime;

    private Boolean is24Hours;

    private Boolean active;

    private Pharmacy.VerificationStatus verificationStatus;

    @Size(max = 500, message = "Logo URL must not exceed 500 characters")
    private String logoUrl;
}
