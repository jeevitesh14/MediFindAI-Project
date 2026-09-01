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

    @GetMapping("/pharmacies")
    public ApiResponse<List<AdminPharmacyDto>> getPharmacies(
            @RequestParam(required = false) Pharmacy.VerificationStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("id").descending());
        Page<AdminPharmacyDto> pharmacies = adminService.getPharmacies(status, search, pageable);
        return ApiResponse.success(pharmacies.getContent());
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

