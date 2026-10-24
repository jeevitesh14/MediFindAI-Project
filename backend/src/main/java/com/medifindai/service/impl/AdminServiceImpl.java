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
        long activePharmacies = pharmacyRepository.countByActiveTrue();
        long inactivePharmacies = pharmacyRepository.countByActiveFalse();
        long pendingPharmacies = pharmacyRepository.countByVerificationStatus(Pharmacy.VerificationStatus.PENDING);
        long verifiedPharmacies = pharmacyRepository.countByVerificationStatus(Pharmacy.VerificationStatus.VERIFIED);
        long rejectedPharmacies = pharmacyRepository.countByVerificationStatus(Pharmacy.VerificationStatus.REJECTED);

        List<AdminPharmacyDto> recentlyAddedPharmacies = pharmacyRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toPharmacyDto)
                .toList();

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
                .activePharmacies(activePharmacies)
                .inactivePharmacies(inactivePharmacies)
                .pendingPharmacies(pendingPharmacies)
                .verifiedPharmacies(verifiedPharmacies)
                .rejectedPharmacies(rejectedPharmacies)
                .recentlyAddedPharmacies(recentlyAddedPharmacies)
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
    public Page<AdminPharmacyDto> getPharmacies(Pharmacy.VerificationStatus status, Boolean active, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return pharmacyRepository.searchPharmaciesAdmin(status, active, cleanSearch, pageable)
                .map(this::toPharmacyDto);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPharmacyDto getPharmacyById(Long pharmacyId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId));
        return toPharmacyDto(pharmacy);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPharmacyDetailsDto getPharmacyDetails(Long pharmacyId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId));

        User owner = pharmacy.getOwner();
        int totalMedicinesStocked = stockRepository.countByPharmacyId(pharmacyId);
        int lowStockItems = stockRepository.countByPharmacyIdAndStockStatus(pharmacyId, MedicineStock.StockStatus.LOW_STOCK);
        int outOfStockItems = stockRepository.countByPharmacyIdAndStockStatus(pharmacyId, MedicineStock.StockStatus.OUT_OF_STOCK);

        int totalReservations = reservationRepository.countByPharmacyId(pharmacyId);
        int pendingReservations = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.PENDING);
        int completedReservations = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.COMPLETED);
        int cancelledReservations = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.CANCELLED);

        List<Order> orders = orderRepository != null ? orderRepository.findByPharmacyIdOrderByCreatedAtDesc(pharmacyId) : List.of();
        int totalOrders = orders.size();
        int pendingOrders = (int) orders.stream().filter(o -> o.getStatus() == Order.Status.PENDING).count();
        int deliveredOrders = (int) orders.stream().filter(o -> o.getStatus() == Order.Status.DELIVERED).count();

        return AdminPharmacyDetailsDto.builder()
                .id(pharmacy.getId())
                .name(pharmacy.getName())
                .licenseNumber(pharmacy.getLicenseNumber())
                .description(pharmacy.getDescription())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .ownerPhone(owner != null ? owner.getPhone() : null)
                .addressLine(pharmacy.getAddressLine())
                .city(pharmacy.getCity())
                .state(pharmacy.getState())
                .postalCode(pharmacy.getPostalCode())
                .latitude(pharmacy.getLatitude())
                .longitude(pharmacy.getLongitude())
                .phone(pharmacy.getPhone())
                .email(pharmacy.getEmail())
                .openingTime(pharmacy.getOpeningTime())
                .closingTime(pharmacy.getClosingTime())
                .is24Hours(pharmacy.is24Hours())
                .verificationStatus(pharmacy.getVerificationStatus() != null ? pharmacy.getVerificationStatus().name() : "PENDING")
                .active(pharmacy.isActive())
                .rating(pharmacy.getRating())
                .logoUrl(pharmacy.getLogoUrl())
                .totalMedicinesStocked(totalMedicinesStocked)
                .lowStockItemsCount(lowStockItems)
                .outOfStockItemsCount(outOfStockItems)
                .totalReservations(totalReservations)
                .pendingReservations(pendingReservations)
                .completedReservations(completedReservations)
                .cancelledReservations(cancelledReservations)
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .deliveredOrders(deliveredOrders)
                .createdAt(pharmacy.getCreatedAt())
                .updatedAt(pharmacy.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public AdminPharmacyDto createPharmacy(CreatePharmacyAdminRequest request) {
        if (pharmacyRepository.existsByLicenseNumber(request.getLicenseNumber().trim())) {
            throw new DuplicateResourceException("Pharmacy with license number '" + request.getLicenseNumber().trim() + "' already exists.");
        }

        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found with id: " + request.getOwnerId()));

        if (owner.getRole() != Role.PHARMACY_OWNER && owner.getRole() != Role.ADMIN) {
            owner.setRole(Role.PHARMACY_OWNER);
            userRepository.save(owner);
            log.info("Elevated user {} role to PHARMACY_OWNER upon pharmacy creation.", owner.getEmail());
        }

        Pharmacy pharmacy = Pharmacy.builder()
                .name(request.getName().trim())
                .licenseNumber(request.getLicenseNumber().trim())
                .owner(owner)
                .description(request.getDescription())
                .addressLine(request.getAddressLine().trim())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .postalCode(request.getPostalCode() != null ? request.getPostalCode().trim() : null)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .openingTime(request.getOpeningTime() != null ? request.getOpeningTime() : java.time.LocalTime.of(8, 0))
                .closingTime(request.getClosingTime() != null ? request.getClosingTime() : java.time.LocalTime.of(22, 0))
                .is24Hours(request.is24Hours())
                .active(request.isActive())
                .verificationStatus(request.getVerificationStatus() != null ? request.getVerificationStatus() : Pharmacy.VerificationStatus.VERIFIED)
                .logoUrl(request.getLogoUrl())
                .rating(4.5)
                .build();

        Pharmacy saved = pharmacyRepository.save(pharmacy);
        log.info("Admin successfully created new pharmacy '{}' (License: {}, ID: {}) assigned to owner '{}'",
                saved.getName(), saved.getLicenseNumber(), saved.getId(), owner.getEmail());

        if (notificationService != null) {
            notificationService.createNotification(
                    owner,
                    "Pharmacy Registered by Admin",
                    "Your pharmacy '" + saved.getName() + "' has been successfully registered on MediFindAI by the administrator.",
                    Notification.Type.SYSTEM,
                    saved.getId(),
                    "/pharmacy-owner/profile"
            );
        }

        return toPharmacyDto(saved);
    }

    @Override
    @Transactional
    public AdminPharmacyDto updatePharmacy(Long pharmacyId, UpdatePharmacyAdminRequest request) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId));

        if (pharmacyRepository.existsByLicenseNumberAndIdNot(request.getLicenseNumber().trim(), pharmacyId)) {
            throw new DuplicateResourceException("Another pharmacy already exists with license number: " + request.getLicenseNumber().trim());
        }

        if (request.getOwnerId() != null && (pharmacy.getOwner() == null || !request.getOwnerId().equals(pharmacy.getOwner().getId()))) {
            User newOwner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner user not found with id: " + request.getOwnerId()));
            if (newOwner.getRole() != Role.PHARMACY_OWNER && newOwner.getRole() != Role.ADMIN) {
                newOwner.setRole(Role.PHARMACY_OWNER);
                userRepository.save(newOwner);
            }
            pharmacy.setOwner(newOwner);
        }

        pharmacy.setName(request.getName().trim());
        pharmacy.setLicenseNumber(request.getLicenseNumber().trim());
        pharmacy.setDescription(request.getDescription());
        pharmacy.setAddressLine(request.getAddressLine().trim());
        pharmacy.setCity(request.getCity().trim());
        pharmacy.setState(request.getState().trim());
        pharmacy.setPostalCode(request.getPostalCode() != null ? request.getPostalCode().trim() : null);
        pharmacy.setLatitude(request.getLatitude());
        pharmacy.setLongitude(request.getLongitude());
        pharmacy.setPhone(request.getPhone().trim());
        pharmacy.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        if (request.getOpeningTime() != null) pharmacy.setOpeningTime(request.getOpeningTime());
        if (request.getClosingTime() != null) pharmacy.setClosingTime(request.getClosingTime());
        if (request.getIs24Hours() != null) pharmacy.set24Hours(request.getIs24Hours());
        if (request.getActive() != null) pharmacy.setActive(request.getActive());
        if (request.getVerificationStatus() != null) pharmacy.setVerificationStatus(request.getVerificationStatus());
        if (request.getLogoUrl() != null) pharmacy.setLogoUrl(request.getLogoUrl());

        Pharmacy saved = pharmacyRepository.save(pharmacy);
        log.info("Admin updated pharmacy '{}' (ID: {})", saved.getName(), saved.getId());
        return toPharmacyDto(saved);
    }

    @Override
    @Transactional
    public AdminPharmacyDto togglePharmacyActive(Long pharmacyId, boolean active) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId));

        pharmacy.setActive(active);
        Pharmacy saved = pharmacyRepository.save(pharmacy);
        log.info("Admin toggled pharmacy '{}' (ID: {}) active state to {}", saved.getName(), saved.getId(), active);

        if (saved.getOwner() != null && notificationService != null) {
            String msg = active
                    ? "Your pharmacy '" + saved.getName() + "' has been activated and is now accepting user reservations."
                    : "Your pharmacy '" + saved.getName() + "' has been temporarily deactivated by system administration.";
            notificationService.createNotification(
                    saved.getOwner(),
                    active ? "Pharmacy Activated" : "Pharmacy Deactivated",
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
    public AdminPharmacyDto assignPharmacyOwner(Long pharmacyId, Long ownerId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId));

        User newOwner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));

        if (newOwner.getRole() != Role.PHARMACY_OWNER && newOwner.getRole() != Role.ADMIN) {
            newOwner.setRole(Role.PHARMACY_OWNER);
            userRepository.save(newOwner);
            log.info("Promoted user {} to PHARMACY_OWNER for pharmacy ownership", newOwner.getEmail());
        }

        pharmacy.setOwner(newOwner);
        Pharmacy saved = pharmacyRepository.save(pharmacy);
        log.info("Admin assigned pharmacy '{}' ownership to '{}' (ID: {})", saved.getName(), newOwner.getEmail(), newOwner.getId());

        if (notificationService != null) {
            notificationService.createNotification(
                    newOwner,
                    "Pharmacy Ownership Assigned",
                    "You have been assigned as the owner of pharmacy '" + saved.getName() + "'.",
                    Notification.Type.SYSTEM,
                    saved.getId(),
                    "/pharmacy-owner/profile"
            );
        }

        return toPharmacyDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.medifindai.dto.pharmacyowner.PharmacyInventoryItemDto> getPharmacyInventory(
            Long pharmacyId, String search, MedicineStock.StockStatus status) {
        if (!pharmacyRepository.existsById(pharmacyId)) {
            throw new ResourceNotFoundException("Pharmacy not found with id: " + pharmacyId);
        }

        List<MedicineStock> stocks = stockRepository.findByPharmacyIdOrderByUpdatedAtDesc(pharmacyId);

        return stocks.stream()
                .filter(ms -> {
                    if (status != null && ms.getStockStatus() != status) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        Medicine m = ms.getMedicine();
                        return m != null && (
                                (m.getName() != null && m.getName().toLowerCase().contains(q)) ||
                                (m.getGenericName() != null && m.getGenericName().toLowerCase().contains(q)) ||
                                (m.getManufacturer() != null && m.getManufacturer().toLowerCase().contains(q)) ||
                                (m.getCategory() != null && m.getCategory().getName().toLowerCase().contains(q))
                        );
                    }
                    return true;
                })
                .map(this::toInventoryDto)
                .toList();
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
                .logoUrl(p.getLogoUrl())
                .totalMedicinesStocked(stocks)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private com.medifindai.dto.pharmacyowner.PharmacyInventoryItemDto toInventoryDto(MedicineStock ms) {
        Medicine m = ms.getMedicine();
        return com.medifindai.dto.pharmacyowner.PharmacyInventoryItemDto.builder()
                .id(ms.getId())
                .medicineId(m != null ? m.getId() : null)
                .medicineName(m != null ? m.getName() : "Unknown")
                .genericName(m != null ? m.getGenericName() : null)
                .manufacturer(m != null ? m.getManufacturer() : null)
                .category(m != null && m.getCategory() != null ? m.getCategory().getName() : null)
                .dosageForm(m != null ? m.getDosageForm() : null)
                .strength(m != null ? m.getStrength() : null)
                .requiresPrescription(m != null && m.isRequiresPrescription())
                .imageUrl(m != null ? m.getImageUrl() : null)
                .quantity(ms.getQuantity())
                .price(ms.getPrice())
                .stockStatus(ms.getStockStatus() != null ? ms.getStockStatus().name() : null)
                .lowStockThreshold(ms.getLowStockThreshold())
                .lastRestockedAt(ms.getLastRestockedAt())
                .updatedAt(ms.getUpdatedAt())
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
