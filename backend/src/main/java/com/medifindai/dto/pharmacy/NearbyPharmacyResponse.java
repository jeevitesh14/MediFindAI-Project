package com.medifindai.dto.pharmacy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyPharmacyResponse {

    private Long id;
    private String name;
    private String description;
    private String licenseNumber;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private String phone;
    private String email;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private boolean is24Hours;
    private boolean isOpenNow;
    private Double rating;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;

    // Optional medicine inventory details (when medicineId query param is supplied)
    private Long medicineId;
    private String medicineName;
    private BigDecimal price;
    private Integer quantity;
    private String stockStatus; // AVAILABLE, LOW_STOCK, OUT_OF_STOCK, NOT_STOCKED
}
