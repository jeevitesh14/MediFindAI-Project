package com.medifindai.dto.admin;

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
public class AdminReservationDto {
    private Long id;
    private String reservationCode;

    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private Long pharmacyId;
    private String pharmacyName;
    private String pharmacyCity;

    private Long medicineId;
    private String medicineName;
    private String genericName;
    private String strength;
    private String dosageForm;
    private boolean requiresPrescription;

    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime pickedUpAt;
    private String cancellationReason;
}
