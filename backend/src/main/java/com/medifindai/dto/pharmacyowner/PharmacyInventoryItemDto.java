package com.medifindai.dto.pharmacyowner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyInventoryItemDto {

    private Long id;
    private Long medicineId;
    private String medicineName;
    private String genericName;
    private String manufacturer;
    private String category;
    private String dosageForm;
    private String strength;
    private boolean requiresPrescription;
    private String imageUrl;

    private Integer quantity;
    private BigDecimal price;
    private String stockStatus;
    private Integer lowStockThreshold;
    private LocalDateTime lastRestockedAt;
    private LocalDateTime updatedAt;
}
