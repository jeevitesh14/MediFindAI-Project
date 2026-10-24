package com.medifindai.service;

import com.medifindai.dto.admin.*;
import com.medifindai.dto.medicine.MedicineSuggestionDto;
import com.medifindai.entity.Pharmacy;
import com.medifindai.entity.Reservation;
import com.medifindai.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService {
    AdminDashboardStatsDto getDashboardStats();

    Page<AdminUserDto> getUsers(Role role, String search, Pageable pageable);
    AdminUserDto updateUserStatus(Long userId, boolean active);

    Page<AdminPharmacyDto> getPharmacies(Pharmacy.VerificationStatus status, Boolean active, String search, Pageable pageable);
    AdminPharmacyDto getPharmacyById(Long pharmacyId);
    AdminPharmacyDetailsDto getPharmacyDetails(Long pharmacyId);
    AdminPharmacyDto createPharmacy(CreatePharmacyAdminRequest request);
    AdminPharmacyDto updatePharmacy(Long pharmacyId, UpdatePharmacyAdminRequest request);
    AdminPharmacyDto togglePharmacyActive(Long pharmacyId, boolean active);
    AdminPharmacyDto assignPharmacyOwner(Long pharmacyId, Long ownerId);
    AdminPharmacyDto verifyPharmacy(Long pharmacyId, VerifyPharmacyRequest request);
    java.util.List<com.medifindai.dto.pharmacyowner.PharmacyInventoryItemDto> getPharmacyInventory(Long pharmacyId, String search, com.medifindai.entity.MedicineStock.StockStatus status);
    void deletePharmacy(Long pharmacyId);

    Page<MedicineSuggestionDto> getMedicines(Long categoryId, String search, Pageable pageable);
    MedicineSuggestionDto createMedicine(CreateMedicineRequest request);
    MedicineSuggestionDto updateMedicine(Long id, UpdateMedicineRequest request);
    void deleteMedicine(Long id);

    Page<AdminReservationDto> getReservations(Reservation.Status status, String search, Pageable pageable);
}
