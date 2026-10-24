package com.medifindai.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPharmacyDto {
    private Long id;
    private String name;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    private String licenseNumber;
    private String description;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private String phone;
    private String email;

    private LocalTime openingTime;
    private LocalTime closingTime;
    private boolean is24Hours;
    private String verificationStatus;
    private boolean active;
    private Double rating;
    private String logoUrl;
    private int totalMedicinesStocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
