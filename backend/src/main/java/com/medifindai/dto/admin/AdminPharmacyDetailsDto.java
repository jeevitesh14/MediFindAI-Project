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
public class AdminPharmacyDetailsDto {

    private Long id;
    private String name;
    private String licenseNumber;
    private String description;

    // Owner details
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    // Location details
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private Double latitude;
    private Double longitude;

    // Contact details
    private String phone;
    private String email;

    // Operations & Timings
    private LocalTime openingTime;
    private LocalTime closingTime;
    private boolean is24Hours;

    // Statuses
    private String verificationStatus;
    private boolean active;
    private Double rating;
    private String logoUrl;

    // Inventory & Activity Summary
    private int totalMedicinesStocked;
    private int lowStockItemsCount;
    private int outOfStockItemsCount;

    private int totalReservations;
    private int pendingReservations;
    private int completedReservations;
    private int cancelledReservations;

    private int totalOrders;
    private int pendingOrders;
    private int deliveredOrders;

    // Audit timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
