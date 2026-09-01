package com.medifindai.service.impl;

import com.medifindai.dto.admin.*;
import com.medifindai.dto.medicine.MedicineSuggestionDto;
import com.medifindai.entity.*;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.DuplicateResourceException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.*;
import com.medifindai.service.AdminService;
import com.medifindai.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineCategoryRepository categoryRepository;
    private final MedicineStockRepository stockRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationStatusHistoryRepository reservationStatusHistoryRepository;
    private final OrderRepository orderRepository;
    private final FavouritePharmacyRepository favouritePharmacyRepository;
    private final PharmacyVerificationRepository pharmacyVerificationRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)

    public AdminDashboardStatsDto getDashboardStats() {
        long totalUsers = userRepository.count();
        long normalUsers = userRepository.countByRole(Role.USER);
        long pharmacyOwners = userRepository.countByRole(Role.PHARMACY_OWNER);
        long admins = userRepository.countByRole(Role.ADMIN);

        long totalPharmacies = pharmacyRepository.count();
        long pendingPharmacies = pharmacyRepository.countByVerificationStatus(Pharmacy.VerificationStatus.PENDING);
        long verifiedPharmacies = pharmacyRepository.countByVerificationStatus(Pharmacy.VerificationStatus.VERIFIED);
        long rejectedPharmacies = pharmacyRepository.countByVerificationStatus(Pharmacy.VerificationStatus.REJECTED);

        long totalMedicines = medicineRepository.count();
        long totalInventoryItems = stockRepository.count();

        long totalReservations = reservationRepository.count();
        long pendingReservations = reservationRepository.countByStatus(Reservation.Status.PENDING);
        long confirmedReservations = reservationRepository.countByStatus(Reservation.Status.CONFIRMED);
        long readyReservations = reservationRepository.countByStatus(Reservation.Status.READY_FOR_PICKUP);
        long completedReservations = reservationRepository.countByStatus(Reservation.Status.COMPLETED);
        long cancelledReservations = reservationRepository.countByStatus(Reservation.Status.CANCELLED);
        long expiredReservations = reservationRepository.countByStatus(Reservation.Status.EXPIRED);

        long totalOrders = orderRepository != null ? orderRepository.count() : 0;
        long pendingOrders = orderRepository != null ? orderRepository.countByStatus(Order.Status.PENDING) : 0;
        long preparingOrders = orderRepository != null ? orderRepository.countByStatus(Order.Status.PREPARING) : 0;
        long readyOrders = orderRepository != null ? orderRepository.countByStatus(Order.Status.READY) : 0;
        long outForDeliveryOrders = orderRepository != null ? orderRepository.countByStatus(Order.Status.OUT_FOR_DELIVERY) : 0;
        long deliveredOrders = orderRepository != null ? orderRepository.countByStatus(Order.Status.DELIVERED) : 0;
        long cancelledOrders = orderRepository != null ? orderRepository.countByStatus(Order.Status.CANCELLED) : 0;

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .totalNormalUsers(normalUsers)
                .totalPharmacyOwners(pharmacyOwners)
                .totalAdmins(admins)
                .totalPharmacies(totalPharmacies)
                .pendingPharmacies(pendingPharmacies)
                .verifiedPharmacies(verifiedPharmacies)
                .rejectedPharmacies(rejectedPharmacies)
                .totalMedicines(totalMedicines)
                .totalInventoryItems(totalInventoryItems)
                .totalReservations(totalReservations)
                .pendingReservations(pendingReservations)
                .confirmedReservations(confirmedReservations)
                .readyReservations(readyReservations)
                .completedReservations(completedReservations)
                .cancelledReservations(cancelledReservations)
                .expiredReservations(expiredReservations)
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .preparingOrders(preparingOrders)
                .readyOrders(readyOrders)
                .outForDeliveryOrders(outForDeliveryOrders)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDto> getUsers(Role role, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return userRepository.searchUsers(role, cleanSearch, pageable)
                .map(this::toUserDto);
    }

    @Override
    @Transactional
    public AdminUserDto updateUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setActive(active);
        User saved = userRepository.save(user);
        log.info("Admin updated user {} status to active={}", user.getEmail(), active);
        return toUserDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminPharmacyDto> getPharmacies(Pharmacy.VerificationStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return pharmacyRepository.searchPharmaciesAdmin(status, cleanSearch, pageable)
                .map(this::toPharmacyDto);
    }

    @Override
    @Transactional
    public AdminPharmacyDto verifyPharmacy(Long pharmacyId, VerifyPharmacyRequest request) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId));

        pharmacy.setVerificationStatus(request.getStatus());
        if (request.getStatus() == Pharmacy.VerificationStatus.VERIFIED) {
            pharmacy.setActive(true);
        } else if (request.getStatus() == Pharmacy.VerificationStatus.REJECTED) {
            pharmacy.setActive(false);
        }

        Pharmacy saved = pharmacyRepository.save(pharmacy);
        log.info("Admin updated pharmacy '{}' verification status to {}", saved.getName(), request.getStatus());

        if (saved.getOwner() != null && notificationService != null) {
            String title = request.getStatus() == Pharmacy.VerificationStatus.VERIFIED
                    ? "Pharmacy License Approved"
                    : "Pharmacy Verification Update";
            String msg = request.getStatus() == Pharmacy.VerificationStatus.VERIFIED
                    ? "Your pharmacy '" + saved.getName() + "' has been officially verified by MediFindAI compliance!"
                    : "Pharmacy verification status changed to " + request.getStatus() + ". Remarks: " + (request.getRemarks() != null ? request.getRemarks() : "N/A");

            notificationService.createNotification(
                    saved.getOwner(),
                    title,
                    msg,
                    Notification.Type.SYSTEM,
                    saved.getId(),
                    "/pharmacy-owner/profile"
            );
        }

        return toPharmacyDto(saved);
    }

    @Override
    @Transactional
    public void deletePharmacy(Long pharmacyId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId));

        String pharmacyName = pharmacy.getName();

        // 1. Clean up reservations & status history
        List<Reservation> reservations = reservationRepository.findByPharmacyIdOrderByCreatedAtDesc(pharmacyId);
        for (Reservation r : reservations) {
            reservationStatusHistoryRepository.deleteByReservationId(r.getId());
            reservationRepository.delete(r);
        }

        // 2. Clean up orders (Order items cascade with Order)
        List<Order> orders = orderRepository != null ? orderRepository.findByPharmacyIdOrderByCreatedAtDesc(pharmacyId) : List.of();
        if (orderRepository != null && !orders.isEmpty()) {
            orderRepository.deleteAll(orders);
        }

        // 3. Clean up stock inventory
        stockRepository.deleteByPharmacyId(pharmacyId);

        // 4. Clean up favourite references
        favouritePharmacyRepository.deleteByPharmacyId(pharmacyId);

        // 5. Clean up verification logs
        pharmacyVerificationRepository.deleteByPharmacyId(pharmacyId);

        // 6. Delete pharmacy
        pharmacyRepository.delete(pharmacy);

        log.info("Admin successfully removed pharmacy '{}' (ID: {}) and all dependent records.", pharmacyName, pharmacyId);

        // 7. Notify owner if present
        if (pharmacy.getOwner() != null && notificationService != null) {
            notificationService.createNotification(
                    pharmacy.getOwner(),
                    "Pharmacy Removed by Administration",
                    "Your pharmacy listing '" + pharmacyName + "' has been removed from the platform by system administration.",
                    Notification.Type.SYSTEM,
                    null,
                    "/pharmacy-owner/dashboard"
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicineSuggestionDto> getMedicines(Long categoryId, String search, Pageable pageable) {

        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return medicineRepository.searchMedicinesAdmin(categoryId, cleanSearch, pageable)
                .map(this::toMedicineDto);
    }

    @Override
    @Transactional
    public MedicineSuggestionDto createMedicine(CreateMedicineRequest request) {
        if (medicineRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("A medicine named '" + request.getName().trim() + "' already exists in the central catalog.");
        }

        if (request.getBarcode() != null && !request.getBarcode().isBlank()) {
            if (medicineRepository.existsByBarcode(request.getBarcode().trim())) {
                throw new DuplicateResourceException("Barcode '" + request.getBarcode().trim() + "' is already registered to another medicine.");
            }
        }

        MedicineCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        }

        Medicine medicine = Medicine.builder()
                .name(request.getName().trim())
                .genericName(request.getGenericName() != null ? request.getGenericName().trim() : null)
                .manufacturer(request.getManufacturer() != null ? request.getManufacturer().trim() : null)
                .category(category)
                .dosageForm(request.getDosageForm() != null ? request.getDosageForm().trim() : "Tablet")
                .strength(request.getStrength() != null ? request.getStrength().trim() : null)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .requiresPrescription(request.isRequiresPrescription())
                .barcode(request.getBarcode() != null && !request.getBarcode().isBlank() ? request.getBarcode().trim() : null)
                .imageUrl(request.getImageUrl())
                .build();

        Medicine saved = medicineRepository.save(medicine);
        log.info("Admin created central medicine: {} (ID: {})", saved.getName(), saved.getId());
        return toMedicineDto(saved);
    }

    @Override
    @Transactional
    public MedicineSuggestionDto updateMedicine(Long id, UpdateMedicineRequest request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        if (request.getBarcode() != null && !request.getBarcode().isBlank()) {
            String cleanCode = request.getBarcode().trim();
            medicineRepository.findByBarcode(cleanCode).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new DuplicateResourceException("Barcode '" + cleanCode + "' is already assigned to " + existing.getName());
                }
            });
        }

        if (request.getCategoryId() != null) {
            MedicineCategory cat = categoryRepository.findById(request.getCategoryId()).orElse(null);
            medicine.setCategory(cat);
        }

        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName() != null ? request.getGenericName().trim() : null);
        medicine.setManufacturer(request.getManufacturer() != null ? request.getManufacturer().trim() : null);
        medicine.setDosageForm(request.getDosageForm() != null ? request.getDosageForm().trim() : "Tablet");
        medicine.setStrength(request.getStrength() != null ? request.getStrength().trim() : null);
        medicine.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        medicine.setRequiresPrescription(request.isRequiresPrescription());
        medicine.setBarcode(request.getBarcode() != null && !request.getBarcode().isBlank() ? request.getBarcode().trim() : null);
        if (request.getImageUrl() != null) {
            medicine.setImageUrl(request.getImageUrl());
        }

        Medicine updated = medicineRepository.save(medicine);
        log.info("Admin updated central medicine: {} (ID: {})", updated.getName(), updated.getId());
        return toMedicineDto(updated);
    }

    @Override
    @Transactional
    public void deleteMedicine(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        // Prevent delete if stocks exist
        int stockCount = stockRepository.findByMedicineId(id).size();
        if (stockCount > 0) {
            throw new BadRequestException("Cannot delete medicine '" + medicine.getName() + "' because it is stocked in " + stockCount + " pharmacies. Deactivate or remove pharmacy stocks first.");
        }

        medicineRepository.delete(medicine);
        log.info("Admin deleted central medicine: {} (ID: {})", medicine.getName(), id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminReservationDto> getReservations(Reservation.Status status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return reservationRepository.searchReservationsAdmin(status, cleanSearch, pageable)
                .map(this::toReservationDto);
    }

    private AdminUserDto toUserDto(User u) {
        return AdminUserDto.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole() != null ? u.getRole().name() : "USER")
                .active(u.isActive())
                .emailVerified(u.isEmailVerified())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private AdminPharmacyDto toPharmacyDto(Pharmacy p) {
        int stocks = stockRepository.countByPharmacyId(p.getId());
        User owner = p.getOwner();

        return AdminPharmacyDto.builder()
                .id(p.getId())
                .name(p.getName())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .ownerPhone(owner != null ? owner.getPhone() : null)
                .licenseNumber(p.getLicenseNumber())
                .description(p.getDescription())
                .addressLine(p.getAddressLine())
                .city(p.getCity())
                .state(p.getState())
                .postalCode(p.getPostalCode())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .phone(p.getPhone())
                .email(p.getEmail())
                .openingTime(p.getOpeningTime())
                .closingTime(p.getClosingTime())
                .is24Hours(p.is24Hours())
                .verificationStatus(p.getVerificationStatus() != null ? p.getVerificationStatus().name() : "PENDING")
                .active(p.isActive())
                .rating(p.getRating())
                .totalMedicinesStocked(stocks)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private MedicineSuggestionDto toMedicineDto(Medicine m) {
        return MedicineSuggestionDto.builder()
                .id(m.getId())
                .name(m.getName())
                .genericName(m.getGenericName())
                .manufacturer(m.getManufacturer())
                .category(m.getCategory() != null ? m.getCategory().getName() : null)
                .dosageForm(m.getDosageForm())
                .strength(m.getStrength())
                .requiresPrescription(m.isRequiresPrescription())
                .barcode(m.getBarcode())
                .build();
    }

    private AdminReservationDto toReservationDto(Reservation r) {
        User u = r.getUser();
        Pharmacy p = r.getPharmacy();
        Medicine m = r.getMedicine();

        return AdminReservationDto.builder()
                .id(r.getId())
                .reservationCode(r.getReservationCode())
                .customerId(u != null ? u.getId() : null)
                .customerName(u != null ? u.getFullName() : null)
                .customerEmail(u != null ? u.getEmail() : null)
                .customerPhone(u != null ? u.getPhone() : null)
                .pharmacyId(p != null ? p.getId() : null)
                .pharmacyName(p != null ? p.getName() : null)
                .pharmacyCity(p != null ? p.getCity() : null)
                .medicineId(m != null ? m.getId() : null)
                .medicineName(m != null ? m.getName() : null)
                .genericName(m != null ? m.getGenericName() : null)
                .strength(m != null ? m.getStrength() : null)
                .dosageForm(m != null ? m.getDosageForm() : null)
                .requiresPrescription(m != null && m.isRequiresPrescription())
                .quantity(r.getQuantity())
                .unitPrice(r.getUnitPrice())
                .totalPrice(r.getTotalPrice())
                .status(r.getStatus() != null ? r.getStatus().name() : "PENDING")
                .createdAt(r.getCreatedAt())
                .expiresAt(r.getExpiresAt())
                .pickedUpAt(r.getPickedUpAt())
                .cancellationReason(r.getCancellationReason())
                .build();
    }
}
