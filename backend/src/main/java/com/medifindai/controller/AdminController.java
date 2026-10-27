package com.medifindai.controller;

import com.medifindai.dto.admin.*;
import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.medicine.MedicineSuggestionDto;
import com.medifindai.entity.Pharmacy;
import com.medifindai.entity.Reservation;
import com.medifindai.entity.Role;
import com.medifindai.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.medifindai.dto.pharmacyowner.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final com.medifindai.service.OrderService orderService;


    // --- Overview Telemetry ---

    @GetMapping("/stats")
    public ApiResponse<AdminDashboardStatsDto> getDashboardStats() {
        AdminDashboardStatsDto stats = adminService.getDashboardStats();
        return ApiResponse.success(stats);
    }

    // --- User Management ---

    @GetMapping("/users")
    public ApiResponse<List<AdminUserDto>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("id").descending());
        Page<AdminUserDto> users = adminService.getUsers(role, search, pageable);
        return ApiResponse.success(users.getContent());
    }

    @PatchMapping("/users/{id}/status")
    public ApiResponse<AdminUserDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean active = body.getOrDefault("active", true);
        AdminUserDto user = adminService.updateUserStatus(id, active);
        return ApiResponse.success("User account status updated successfully.", user);
    }

    // --- Pharmacy Management & Verification ---

    @PostMapping("/pharmacies")
    public ResponseEntity<ApiResponse<AdminPharmacyDto>> createPharmacy(
            @Valid @RequestBody CreatePharmacyAdminRequest request) {
        AdminPharmacyDto created = adminService.createPharmacy(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pharmacy registered successfully.", created));
    }

    @GetMapping("/pharmacies")
    public ApiResponse<List<AdminPharmacyDto>> getPharmacies(
            @RequestParam(required = false) Pharmacy.VerificationStatus status,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("id").descending());
        Page<AdminPharmacyDto> pharmacies = adminService.getPharmacies(status, active, search, pageable);
        return ApiResponse.success(pharmacies.getContent());
    }

    @GetMapping("/pharmacies/{id}")
    public ApiResponse<AdminPharmacyDetailsDto> getPharmacyDetails(@PathVariable Long id) {
        AdminPharmacyDetailsDto details = adminService.getPharmacyDetails(id);
        return ApiResponse.success(details);
    }

    @PutMapping("/pharmacies/{id}")
    public ApiResponse<AdminPharmacyDto> updatePharmacy(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePharmacyAdminRequest request) {
        AdminPharmacyDto updated = adminService.updatePharmacy(id, request);
        return ApiResponse.success("Pharmacy updated successfully.", updated);
    }

    @PatchMapping("/pharmacies/{id}/status")
    public ApiResponse<AdminPharmacyDto> togglePharmacyActive(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Boolean> body,
            @RequestParam(required = false) Boolean active) {
        boolean isActive = true;
        if (body != null && body.containsKey("active")) {
            isActive = Boolean.TRUE.equals(body.get("active"));
        } else if (active != null) {
            isActive = active;
        }
        AdminPharmacyDto updated = adminService.togglePharmacyActive(id, isActive);
        String msg = isActive ? "Pharmacy activated successfully." : "Pharmacy deactivated successfully.";
        return ApiResponse.success(msg, updated);
    }

    public ApiResponse<AdminPharmacyDto> togglePharmacyActive(Long id, Map<String, Boolean> body) {
        return togglePharmacyActive(id, body, null);
    }

    @PatchMapping("/pharmacies/{id}/owner")
    public ApiResponse<AdminPharmacyDto> assignPharmacyOwner(
            @PathVariable Long id,
            @Valid @RequestBody AssignPharmacyOwnerRequest request) {
        AdminPharmacyDto updated = adminService.assignPharmacyOwner(id, request.getOwnerId());
        return ApiResponse.success("Pharmacy owner assigned successfully.", updated);
    }

    @GetMapping("/pharmacies/{id}/inventory")
    public ApiResponse<List<PharmacyInventoryItemDto>> getPharmacyInventory(
            @PathVariable Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) com.medifindai.entity.MedicineStock.StockStatus status) {
        List<PharmacyInventoryItemDto> items =
                adminService.getPharmacyInventory(id, search, status);
        return ApiResponse.success(items);
    }

    @PostMapping("/pharmacies/{id}/inventory")
    public ResponseEntity<ApiResponse<PharmacyInventoryItemDto>> addPharmacyInventory(
            @PathVariable Long id,
            @Valid @RequestBody AddInventoryRequest request) {
        PharmacyInventoryItemDto item = adminService.addPharmacyInventory(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medicine added to pharmacy inventory successfully.", item));
    }

    @PutMapping("/pharmacies/{id}/inventory/{stockId}")
    public ApiResponse<PharmacyInventoryItemDto> updatePharmacyInventory(
            @PathVariable Long id,
            @PathVariable Long stockId,
            @Valid @RequestBody UpdateInventoryRequest request) {
        PharmacyInventoryItemDto item = adminService.updatePharmacyInventory(id, stockId, request);
        return ApiResponse.success("Inventory stock and pricing updated successfully.", item);
    }

    @PatchMapping("/pharmacies/{id}/inventory/{stockId}/stock")
    public ApiResponse<PharmacyInventoryItemDto> updatePharmacyStockQuantity(
            @PathVariable Long id,
            @PathVariable Long stockId,
            @Valid @RequestBody UpdateStockQuantityRequest request) {
        PharmacyInventoryItemDto item = adminService.updatePharmacyStockQuantity(id, stockId, request.getQuantity());
        return ApiResponse.success("Stock quantity updated successfully.", item);
    }

    @PatchMapping("/pharmacies/{id}/inventory/{stockId}/price")
    public ApiResponse<PharmacyInventoryItemDto> updatePharmacyStockPrice(
            @PathVariable Long id,
            @PathVariable Long stockId,
            @Valid @RequestBody UpdateStockPriceRequest request) {
        PharmacyInventoryItemDto item = adminService.updatePharmacyStockPrice(id, stockId, request.getPrice());
        return ApiResponse.success("Stock price updated successfully.", item);
    }

    @DeleteMapping("/pharmacies/{id}/inventory/{stockId}")
    public ApiResponse<Void> deletePharmacyInventory(
            @PathVariable Long id,
            @PathVariable Long stockId) {
        adminService.deletePharmacyInventory(id, stockId);
        return ApiResponse.success("Medicine removed from pharmacy inventory successfully.", null);
    }

    @GetMapping("/pharmacies/{id}/reservations")
    public ApiResponse<List<PharmacyReservationDto>> getPharmacyReservations(
            @PathVariable Long id,
            @RequestParam(required = false) Reservation.Status status,
            @RequestParam(required = false) String search) {
        List<PharmacyReservationDto> items = adminService.getPharmacyReservations(id, status, search);
        return ApiResponse.success(items);
    }

    @PatchMapping("/pharmacies/{id}/verify")
    public ApiResponse<AdminPharmacyDto> verifyPharmacy(
            @PathVariable Long id,
            @Valid @RequestBody VerifyPharmacyRequest request) {
        AdminPharmacyDto updated = adminService.verifyPharmacy(id, request);
        return ApiResponse.success("Pharmacy verification status updated to " + request.getStatus() + ".", updated);
    }

    @DeleteMapping("/pharmacies/{id}")
    public ApiResponse<Void> deletePharmacy(@PathVariable Long id) {
        adminService.deletePharmacy(id);
        return ApiResponse.success("Pharmacy partner removed successfully.", null);
    }


    // --- Central Medicine Catalog Management ---

    @GetMapping("/medicines")
    public ApiResponse<List<MedicineSuggestionDto>> getMedicines(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("name").ascending());
        Page<MedicineSuggestionDto> medicines = adminService.getMedicines(categoryId, search, pageable);
        return ApiResponse.success(medicines.getContent());
    }

    @PostMapping("/medicines")
    public ResponseEntity<ApiResponse<MedicineSuggestionDto>> createMedicine(
            @Valid @RequestBody CreateMedicineRequest request) {
        MedicineSuggestionDto created = adminService.createMedicine(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medicine added to central catalog successfully.", created));
    }

    @PutMapping("/medicines/{id}")
    public ApiResponse<MedicineSuggestionDto> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicineRequest request) {
        MedicineSuggestionDto updated = adminService.updateMedicine(id, request);
        return ApiResponse.success("Medicine updated in central catalog successfully.", updated);
    }

    @DeleteMapping("/medicines/{id}")
    public ApiResponse<Void> deleteMedicine(@PathVariable Long id) {
        adminService.deleteMedicine(id);
        return ApiResponse.success("Medicine removed from central catalog successfully.", null);
    }

    // --- System-wide Reservation Monitoring ---

    @GetMapping("/reservations")
    public ApiResponse<List<AdminReservationDto>> getReservations(
            @RequestParam(required = false) Reservation.Status status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("createdAt").descending());
        Page<AdminReservationDto> list = adminService.getReservations(status, search, pageable);
        return ApiResponse.success(list.getContent());
    }

    // --- System-wide Orders Monitoring ---

    @GetMapping("/orders")
    public ApiResponse<List<com.medifindai.dto.order.OrderResponse>> getOrders(
            @RequestParam(required = false) com.medifindai.entity.Order.Status status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("createdAt").descending());
        Page<com.medifindai.dto.order.OrderResponse> list = orderService.getAdminOrders(status, search, pageable);
        return ApiResponse.success(list.getContent());
    }
}

