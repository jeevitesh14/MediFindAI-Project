package com.medifindai.service;

import com.medifindai.dto.pharmacyowner.*;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.Reservation;

import java.math.BigDecimal;
import java.util.List;

public interface PharmacyOwnerService {

    PharmacyProfileResponse getPharmacyProfile(Long ownerId);

    PharmacyProfileResponse updatePharmacyProfile(Long ownerId, UpdatePharmacyRequest request);

    PharmacyDashboardStatsDto getDashboardStats(Long ownerId);

    List<PharmacyInventoryItemDto> getInventory(Long ownerId, String search, MedicineStock.StockStatus status);

    PharmacyInventoryItemDto getInventoryItem(Long ownerId, Long stockId);

    PharmacyInventoryItemDto addInventoryItem(Long ownerId, AddInventoryRequest request);

    PharmacyInventoryItemDto updateInventoryItem(Long ownerId, Long stockId, UpdateInventoryRequest request);

    PharmacyInventoryItemDto updateStockQuantity(Long ownerId, Long stockId, Integer quantity);

    PharmacyInventoryItemDto updateStockPrice(Long ownerId, Long stockId, BigDecimal price);

    void deleteInventoryItem(Long ownerId, Long stockId);

    List<PharmacyReservationDto> getReservations(Long ownerId, Reservation.Status status, String search);

    PharmacyReservationDto getReservationById(Long ownerId, Long reservationId);

    PharmacyReservationDto confirmReservation(Long ownerId, Long reservationId);

    PharmacyReservationDto rejectReservation(Long ownerId, Long reservationId, String reason);

    PharmacyReservationDto markReservationReady(Long ownerId, Long reservationId);

    PharmacyReservationDto markReservationCompleted(Long ownerId, Long reservationId);
}
