package com.medifindai.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Long medicineId;
    private String medicineName;
    private String genericName;
    private String strength;
    private String dosageForm;
    private boolean requiresPrescription;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
