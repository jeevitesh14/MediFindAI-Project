package com.medifindai.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long totalNormalUsers;
    private long totalPharmacyOwners;
    private long totalAdmins;

    private long totalPharmacies;
    private long activePharmacies;
    private long inactivePharmacies;
    private long pendingPharmacies;
    private long verifiedPharmacies;
    private long rejectedPharmacies;
    private java.util.List<AdminPharmacyDto> recentlyAddedPharmacies;

    private long totalMedicines;
    private long totalInventoryItems;

    private long totalReservations;
    private long pendingReservations;
    private long confirmedReservations;
    private long readyReservations;
    private long completedReservations;
    private long cancelledReservations;
    private long expiredReservations;

    private long totalOrders;
    private long pendingOrders;
    private long preparingOrders;
    private long readyOrders;
    private long outForDeliveryOrders;
    private long deliveredOrders;
    private long cancelledOrders;
}

