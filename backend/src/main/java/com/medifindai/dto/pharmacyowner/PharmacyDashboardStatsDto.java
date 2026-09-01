package com.medifindai.dto.pharmacyowner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyDashboardStatsDto {

    private Long pharmacyId;
    private String pharmacyName;
    private String verificationStatus;
    private boolean active;

    private int totalMedicines;
    private int availableCount;
    private int lowStockCount;
    private int outOfStockCount;

    private int pendingReservationsCount;
    private int confirmedReservationsCount;
    private int readyForPickupCount;
    private int completedReservationsCount;
    private int cancelledReservationsCount;
    private int expiredReservationsCount;

    private int totalOrdersCount;
    private int pendingOrdersCount;
    private int preparingOrdersCount;
    private int readyOrdersCount;
    private int outForDeliveryOrdersCount;
    private int deliveredOrdersCount;
    private int cancelledOrdersCount;

    private List<PharmacyReservationDto> recentReservations;
}

