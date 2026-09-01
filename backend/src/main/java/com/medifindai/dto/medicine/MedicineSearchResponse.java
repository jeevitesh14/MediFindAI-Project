package com.medifindai.dto.medicine;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.List;

@Value
@Builder
public class MedicineSearchResponse {
    Long id;
    String name;
    String genericName;
    String manufacturer;
    String category;
    String dosageForm;
    String strength;
    boolean requiresPrescription;
    List<PharmacyResult> pharmacies;

    @Value
    @Builder
    public static class PharmacyResult {
        Long pharmacyId;
        String pharmacyName;
        String address;
        String city;
        BigDecimal price;
        Integer quantity;
        String stockStatus;
    }
}