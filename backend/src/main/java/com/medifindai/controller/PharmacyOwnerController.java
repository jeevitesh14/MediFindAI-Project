package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.pharmacyowner.*;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.Reservation;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.PharmacyOwnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pharmacy-owner")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PHARMACY_OWNER', 'ADMIN')")
public class PharmacyOwnerController {

    private final PharmacyOwnerService pharmacyOwnerService;
    private final com.medifindai.service.OrderService orderService;


    // --- Pharmacy Profile ---

    @GetMapping("/pharmacy")
    public ApiResponse<PharmacyProfileResponse> getPharmacyProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        PharmacyProfileResponse response = pharmacyOwnerService.getPharmacyProfile(principal.getId());
        return ApiResponse.success(response);
    }

    @PutMapping("/pharmacy")
    public ApiResponse<PharmacyProfileResponse> updatePharmacyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePharmacyRequest request) {
        PharmacyProfileResponse response = pharmacyOwnerService.updatePharmacyProfile(principal.getId(), request);
        return ApiResponse.success("Pharmacy profile updated successfully.", response);
    }

    // --- Dashboard Stats ---

    @GetMapping("/stats")
    public ApiResponse<PharmacyDashboardStatsDto> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        PharmacyDashboardStatsDto stats = pharmacyOwnerService.getDashboardStats(principal.getId());
        return ApiResponse.success(stats);
    }

    // --- Inventory Management ---

    @GetMapping("/inventory")
    public ApiResponse<List<PharmacyInventoryItemDto>> getInventory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) MedicineStock.StockStatus status) {
        List<PharmacyInventoryItemDto> items = pharmacyOwnerService.getInventory(principal.getId(), search, status);
        return ApiResponse.success(items);
    }

    @GetMapping("/inventory/{id}")
    public ApiResponse<PharmacyInventoryItemDto> getInventoryItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        PharmacyInventoryItemDto item = pharmacyOwnerService.getInventoryItem(principal.getId(), id);
        return ApiResponse.success(item);
    }

    @PostMapping("/inventory")
    public ResponseEntity<ApiResponse<PharmacyInventoryItemDto>> addInventoryItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddInventoryRequest request) {
        PharmacyInventoryItemDto item = pharmacyOwnerService.addInventoryItem(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medicine added to pharmacy inventory successfully.", item));
    }

    @PutMapping("/inventory/{id}")
    public ApiResponse<PharmacyInventoryItemDto> updateInventoryItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateInventoryRequest request) {
        PharmacyInventoryItemDto item = pharmacyOwnerService.updateInventoryItem(principal.getId(), id, request);
        return ApiResponse.success("Inventory stock and pricing updated successfully.", item);
    }

    @PatchMapping("/inventory/{id}/stock")
    public ApiResponse<PharmacyInventoryItemDto> updateStockQuantity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStockQuantityRequest request) {
        PharmacyInventoryItemDto item = pharmacyOwnerService.updateStockQuantity(principal.getId(), id, request.getQuantity());
        return ApiResponse.success("Stock quantity updated successfully.", item);
    }

    @PatchMapping("/inventory/{id}/price")
    public ApiResponse<PharmacyInventoryItemDto> updateStockPrice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStockPriceRequest request) {
        PharmacyInventoryItemDto item = pharmacyOwnerService.updateStockPrice(principal.getId(), id, request.getPrice());
        return ApiResponse.success("Unit price updated successfully.", item);
    }

    @DeleteMapping("/inventory/{id}")
    public ApiResponse<Void> deleteInventoryItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        pharmacyOwnerService.deleteInventoryItem(principal.getId(), id);
        return ApiResponse.success("Medicine removed from inventory successfully.", null);
    }

    // --- Reservation Management ---

    @GetMapping("/reservations")
    public ApiResponse<List<PharmacyReservationDto>> getReservations(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Reservation.Status status,
            @RequestParam(required = false) String search) {
        List<PharmacyReservationDto> list = pharmacyOwnerService.getReservations(principal.getId(), status, search);
        return ApiResponse.success(list);
    }

    @GetMapping("/reservations/{id}")
    public ApiResponse<PharmacyReservationDto> getReservationById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        PharmacyReservationDto reservation = pharmacyOwnerService.getReservationById(principal.getId(), id);
        return ApiResponse.success(reservation);
    }

    @PostMapping("/reservations/{id}/confirm")
    public ApiResponse<PharmacyReservationDto> confirmReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        PharmacyReservationDto result = pharmacyOwnerService.confirmReservation(principal.getId(), id);
        return ApiResponse.success("Reservation confirmed for 24-hour hold.", result);
    }

    @PostMapping("/reservations/{id}/reject")
    public ApiResponse<PharmacyReservationDto> rejectReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) RejectReservationRequest request) {
        String reason = (request != null) ? request.getReason() : null;
        PharmacyReservationDto result = pharmacyOwnerService.rejectReservation(principal.getId(), id, reason);
        return ApiResponse.success("Reservation cancelled and stock restored to inventory.", result);
    }

    @PostMapping("/reservations/{id}/ready")
    public ApiResponse<PharmacyReservationDto> markReservationReady(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        PharmacyReservationDto result = pharmacyOwnerService.markReservationReady(principal.getId(), id);
        return ApiResponse.success("Reservation marked ready for customer counter pickup.", result);
    }

    @PostMapping("/reservations/{id}/complete")
    public ApiResponse<PharmacyReservationDto> markReservationCompleted(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        PharmacyReservationDto result = pharmacyOwnerService.markReservationCompleted(principal.getId(), id);
        return ApiResponse.success("Reservation completed and medicine successfully dispensed.", result);
    }

    // --- Order Management ---

    @GetMapping("/orders")
    public ApiResponse<List<com.medifindai.dto.order.OrderResponse>> getOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) com.medifindai.entity.Order.Status status) {
        List<com.medifindai.dto.order.OrderResponse> orders = orderService.getPharmacyOrders(principal.getId(), status);
        return ApiResponse.success(orders);
    }

    @PatchMapping("/orders/{id}/status")
    public ApiResponse<com.medifindai.dto.order.OrderResponse> updateOrderStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody com.medifindai.dto.order.UpdateOrderStatusRequest request) {
        com.medifindai.dto.order.OrderResponse order = orderService.updatePharmacyOrderStatus(principal.getId(), id, request);
        return ApiResponse.success("Order status updated to " + request.getStatus() + ".", order);
    }
}

