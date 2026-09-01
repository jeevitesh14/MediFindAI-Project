package com.medifindai.service.impl;

import com.medifindai.dto.pharmacyowner.*;
import com.medifindai.entity.*;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.DuplicateResourceException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.*;
import com.medifindai.service.PharmacyOwnerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyOwnerServiceImpl implements PharmacyOwnerService {

    private final PharmacyRepository pharmacyRepository;
    private final MedicineStockRepository medicineStockRepository;
    private final MedicineRepository medicineRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final com.medifindai.service.NotificationService notificationService;


    @Override
    @Transactional
    public PharmacyProfileResponse getPharmacyProfile(Long ownerId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        return toProfileResponse(pharmacy);
    }

    @Override
    @Transactional
    public PharmacyProfileResponse updatePharmacyProfile(Long ownerId, UpdatePharmacyRequest request) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);

        pharmacy.setName(request.getName().trim());
        pharmacy.setDescription(request.getDescription());
        pharmacy.setAddressLine(request.getAddressLine().trim());
        pharmacy.setCity(request.getCity().trim());
        pharmacy.setState(request.getState().trim());
        pharmacy.setPostalCode(request.getPostalCode());
        pharmacy.setPhone(request.getPhone().trim());
        pharmacy.setEmail(request.getEmail().trim());
        pharmacy.setLatitude(request.getLatitude());
        pharmacy.setLongitude(request.getLongitude());
        pharmacy.setOpeningTime(request.getOpeningTime());
        pharmacy.setClosingTime(request.getClosingTime());
        pharmacy.set24Hours(request.is24Hours());
        if (request.getLogoUrl() != null) {
            pharmacy.setLogoUrl(request.getLogoUrl());
        }

        Pharmacy updated = pharmacyRepository.save(pharmacy);
        log.info("Pharmacy owner {} updated pharmacy profile: {}", ownerId, updated.getName());
        return toProfileResponse(updated);
    }

    @Override
    @Transactional
    public PharmacyDashboardStatsDto getDashboardStats(Long ownerId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        Long pharmacyId = pharmacy.getId();

        int totalMedicines = medicineStockRepository.countByPharmacyId(pharmacyId);
        int availableCount = medicineStockRepository.countByPharmacyIdAndStockStatus(pharmacyId, MedicineStock.StockStatus.AVAILABLE);
        int lowStockCount = medicineStockRepository.countByPharmacyIdAndStockStatus(pharmacyId, MedicineStock.StockStatus.LOW_STOCK);
        int outOfStockCount = medicineStockRepository.countByPharmacyIdAndStockStatus(pharmacyId, MedicineStock.StockStatus.OUT_OF_STOCK);

        int pendingCount = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.PENDING);
        int confirmedCount = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.CONFIRMED);
        int readyCount = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.READY_FOR_PICKUP);
        int completedCount = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.COMPLETED);
        int cancelledCount = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.CANCELLED);
        int expiredCount = reservationRepository.countByPharmacyIdAndStatus(pharmacyId, Reservation.Status.EXPIRED);

        int totalOrders = orderRepository != null ? (int) orderRepository.countByPharmacyId(pharmacyId) : 0;
        int pendingOrders = orderRepository != null ? (int) orderRepository.countByPharmacyIdAndStatus(pharmacyId, Order.Status.PENDING) : 0;
        int preparingOrders = orderRepository != null ? (int) orderRepository.countByPharmacyIdAndStatus(pharmacyId, Order.Status.PREPARING) : 0;
        int readyOrders = orderRepository != null ? (int) orderRepository.countByPharmacyIdAndStatus(pharmacyId, Order.Status.READY) : 0;
        int outForDeliveryOrders = orderRepository != null ? (int) orderRepository.countByPharmacyIdAndStatus(pharmacyId, Order.Status.OUT_FOR_DELIVERY) : 0;
        int deliveredOrders = orderRepository != null ? (int) orderRepository.countByPharmacyIdAndStatus(pharmacyId, Order.Status.DELIVERED) : 0;
        int cancelledOrders = orderRepository != null ? (int) orderRepository.countByPharmacyIdAndStatus(pharmacyId, Order.Status.CANCELLED) : 0;

        List<PharmacyReservationDto> recentReservations = reservationRepository
                .findByPharmacyIdOrderByCreatedAtDesc(pharmacyId)
                .stream()
                .limit(5)
                .map(this::toReservationDto)
                .toList();

        return PharmacyDashboardStatsDto.builder()
                .pharmacyId(pharmacyId)
                .pharmacyName(pharmacy.getName())
                .verificationStatus(pharmacy.getVerificationStatus().name())
                .active(pharmacy.isActive())
                .totalMedicines(totalMedicines)
                .availableCount(availableCount)
                .lowStockCount(lowStockCount)
                .outOfStockCount(outOfStockCount)
                .pendingReservationsCount(pendingCount)
                .confirmedReservationsCount(confirmedCount)
                .readyForPickupCount(readyCount)
                .completedReservationsCount(completedCount)
                .cancelledReservationsCount(cancelledCount)
                .expiredReservationsCount(expiredCount)
                .totalOrdersCount(totalOrders)
                .pendingOrdersCount(pendingOrders)
                .preparingOrdersCount(preparingOrders)
                .readyOrdersCount(readyOrders)
                .outForDeliveryOrdersCount(outForDeliveryOrders)
                .deliveredOrdersCount(deliveredOrders)
                .cancelledOrdersCount(cancelledOrders)
                .recentReservations(recentReservations)
                .build();
    }

    @Override
    @Transactional
    public List<PharmacyInventoryItemDto> getInventory(Long ownerId, String search, MedicineStock.StockStatus status) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        List<MedicineStock> stocks = medicineStockRepository.findByPharmacyIdOrderByUpdatedAtDesc(pharmacy.getId());

        return stocks.stream()
                .filter(stock -> {
                    if (status != null && stock.getStockStatus() != status) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase().trim();
                        Medicine m = stock.getMedicine();
                        boolean matchesName = m.getName() != null && m.getName().toLowerCase().contains(s);
                        boolean matchesGeneric = m.getGenericName() != null && m.getGenericName().toLowerCase().contains(s);
                        boolean matchesCategory = m.getCategory() != null && m.getCategory().getName() != null && m.getCategory().getName().toLowerCase().contains(s);
                        return matchesName || matchesGeneric || matchesCategory;
                    }
                    return true;
                })
                .map(this::toInventoryItemDto)
                .toList();
    }

    @Override
    @Transactional
    public PharmacyInventoryItemDto getInventoryItem(Long ownerId, Long stockId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        MedicineStock stock = medicineStockRepository.findByIdAndPharmacyId(stockId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + stockId));
        return toInventoryItemDto(stock);
    }

    @Override
    @Transactional
    public PharmacyInventoryItemDto addInventoryItem(Long ownerId, AddInventoryRequest request) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);

        if (request.getQuantity() == null || request.getQuantity() < 0) {
            throw new BadRequestException("Quantity cannot be negative.");
        }
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price must be greater than zero.");
        }

        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + request.getMedicineId()));

        if (medicineStockRepository.existsByPharmacyIdAndMedicineId(pharmacy.getId(), medicine.getId())) {
            throw new DuplicateResourceException(
                    "Medicine '" + medicine.getName() + "' is already in your pharmacy inventory. Please update the existing stock instead."
            );
        }

        int threshold = (request.getLowStockThreshold() != null && request.getLowStockThreshold() >= 1)
                ? request.getLowStockThreshold()
                : 10;

        MedicineStock stock = MedicineStock.builder()
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .lowStockThreshold(threshold)
                .lastRestockedAt(request.getQuantity() > 0 ? LocalDateTime.now() : null)
                .build();

        stock.recalculateStatus();
        MedicineStock savedStock = medicineStockRepository.save(stock);

        log.info("Pharmacy {} added medicine {} (Qty: {}, Price: ₹{}) to inventory",
                pharmacy.getName(), medicine.getName(), request.getQuantity(), request.getPrice());

        return toInventoryItemDto(savedStock);
    }

    @Override
    @Transactional
    public PharmacyInventoryItemDto updateInventoryItem(Long ownerId, Long stockId, UpdateInventoryRequest request) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);

        if (request.getQuantity() == null || request.getQuantity() < 0) {
            throw new BadRequestException("Quantity cannot be negative.");
        }
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price must be greater than zero.");
        }

        MedicineStock stock = medicineStockRepository.findByIdAndPharmacyId(stockId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + stockId));

        if (request.getQuantity() > stock.getQuantity()) {
            stock.setLastRestockedAt(LocalDateTime.now());
        }

        stock.setQuantity(request.getQuantity());
        stock.setPrice(request.getPrice());
        if (request.getLowStockThreshold() != null && request.getLowStockThreshold() >= 1) {
            stock.setLowStockThreshold(request.getLowStockThreshold());
        }

        stock.recalculateStatus();
        MedicineStock saved = medicineStockRepository.save(stock);

        log.info("Pharmacy {} updated inventory item {} (Qty: {}, Price: ₹{})",
                pharmacy.getName(), stockId, request.getQuantity(), request.getPrice());

        return toInventoryItemDto(saved);
    }

    @Override
    @Transactional
    public PharmacyInventoryItemDto updateStockQuantity(Long ownerId, Long stockId, Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new BadRequestException("Quantity cannot be negative.");
        }

        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        MedicineStock stock = medicineStockRepository.findByIdAndPharmacyId(stockId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + stockId));

        if (quantity > stock.getQuantity()) {
            stock.setLastRestockedAt(LocalDateTime.now());
        }

        stock.setQuantity(quantity);
        stock.recalculateStatus();
        MedicineStock saved = medicineStockRepository.save(stock);
        return toInventoryItemDto(saved);
    }

    @Override
    @Transactional
    public PharmacyInventoryItemDto updateStockPrice(Long ownerId, Long stockId, BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price must be greater than zero.");
        }

        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        MedicineStock stock = medicineStockRepository.findByIdAndPharmacyId(stockId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + stockId));

        stock.setPrice(price);
        MedicineStock saved = medicineStockRepository.save(stock);
        return toInventoryItemDto(saved);
    }

    @Override
    @Transactional
    public void deleteInventoryItem(Long ownerId, Long stockId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        MedicineStock stock = medicineStockRepository.findByIdAndPharmacyId(stockId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + stockId));

        medicineStockRepository.delete(stock);
        log.info("Pharmacy {} removed inventory item {}", pharmacy.getName(), stockId);
    }

    @Override
    @Transactional
    public List<PharmacyReservationDto> getReservations(Long ownerId, Reservation.Status status, String search) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        List<Reservation> list = (status != null)
                ? reservationRepository.findByPharmacyIdAndStatusOrderByCreatedAtDesc(pharmacy.getId(), status)
                : reservationRepository.findByPharmacyIdOrderByCreatedAtDesc(pharmacy.getId());

        return list.stream()
                .filter(r -> {
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase().trim();
                        boolean matchCode = r.getReservationCode() != null && r.getReservationCode().toLowerCase().contains(s);
                        boolean matchMed = r.getMedicine() != null && r.getMedicine().getName() != null && r.getMedicine().getName().toLowerCase().contains(s);
                        boolean matchUser = r.getUser() != null && r.getUser().getFullName() != null && r.getUser().getFullName().toLowerCase().contains(s);
                        return matchCode || matchMed || matchUser;
                    }
                    return true;
                })
                .map(this::toReservationDto)
                .toList();
    }

    @Override
    @Transactional
    public PharmacyReservationDto getReservationById(Long ownerId, Long reservationId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        Reservation reservation = reservationRepository.findByIdAndPharmacyId(reservationId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));
        return toReservationDto(reservation);
    }

    @Override
    @Transactional
    public PharmacyReservationDto confirmReservation(Long ownerId, Long reservationId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found with id: " + ownerId));

        Reservation reservation = reservationRepository.findByIdAndPharmacyId(reservationId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (reservation.getStatus() != Reservation.Status.PENDING) {
            throw new BadRequestException("Only PENDING reservations can be confirmed. Current status: " + reservation.getStatus());
        }

        // Check if hold window already expired
        if (reservation.getExpiresAt() != null && reservation.getExpiresAt().isBefore(LocalDateTime.now())) {
            expireAndRestoreStock(reservation, "Hold expired before pharmacy confirmation");
            throw new BadRequestException("This reservation has expired and can no longer be confirmed.");
        }

        String oldStatus = reservation.getStatus().name();
        reservation.setStatus(Reservation.Status.CONFIRMED);
        Reservation updated = reservationRepository.save(reservation);

        recordStatusHistory(updated, oldStatus, Reservation.Status.CONFIRMED.name(), owner, "Confirmed by pharmacy partner");
        log.info("Reservation {} confirmed by pharmacy owner {}", reservation.getReservationCode(), ownerId);

        if (reservation.getUser() != null && notificationService != null) {
            notificationService.createNotification(
                    reservation.getUser(),
                    "Reservation Confirmed",
                    pharmacy.getName() + " confirmed your 24-hour hold for " + reservation.getMedicine().getName() + " (Code: " + reservation.getReservationCode() + ").",
                    Notification.Type.RESERVATION,
                    reservation.getId(),
                    "/dashboard/reservations"
            );
        }

        return toReservationDto(updated);
    }

    @Override
    @Transactional
    public PharmacyReservationDto rejectReservation(Long ownerId, Long reservationId, String reason) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found with id: " + ownerId));

        Reservation reservation = reservationRepository.findByIdAndPharmacyId(reservationId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (reservation.getStatus() != Reservation.Status.PENDING && reservation.getStatus() != Reservation.Status.CONFIRMED) {
            throw new BadRequestException("Reservation cannot be rejected in its current status: " + reservation.getStatus());
        }

        String oldStatus = reservation.getStatus().name();
        String cancelReason = (reason != null && !reason.isBlank())
                ? "Rejected by pharmacy: " + reason.trim()
                : "Rejected by pharmacy partner";

        // Restore stock exactly once
        MedicineStock stock = medicineStockRepository
                .findByPharmacyIdAndMedicineIdForUpdate(pharmacy.getId(), reservation.getMedicine().getId())
                .orElse(null);

        if (stock != null) {
            int currentQty = stock.getQuantity() != null ? stock.getQuantity() : 0;
            stock.setQuantity(currentQty + reservation.getQuantity());
            stock.recalculateStatus();
            medicineStockRepository.save(stock);
        }

        reservation.setStatus(Reservation.Status.CANCELLED);
        reservation.setCancellationReason(cancelReason);
        Reservation updated = reservationRepository.save(reservation);

        recordStatusHistory(updated, oldStatus, Reservation.Status.CANCELLED.name(), owner, cancelReason);
        log.info("Reservation {} rejected by pharmacy owner {} - Stock restored (Qty: {})",
                reservation.getReservationCode(), ownerId, reservation.getQuantity());

        if (reservation.getUser() != null && notificationService != null) {
            notificationService.createNotification(
                    reservation.getUser(),
                    "Reservation Cancelled",
                    "Your hold for " + reservation.getMedicine().getName() + " was cancelled by " + pharmacy.getName() + ": " + cancelReason,
                    Notification.Type.RESERVATION,
                    reservation.getId(),
                    "/dashboard/reservations"
            );
        }

        return toReservationDto(updated);
    }

    @Override
    @Transactional
    public PharmacyReservationDto markReservationReady(Long ownerId, Long reservationId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found with id: " + ownerId));

        Reservation reservation = reservationRepository.findByIdAndPharmacyId(reservationId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (reservation.getStatus() != Reservation.Status.CONFIRMED) {
            throw new BadRequestException("Only CONFIRMED reservations can be marked ready for pickup. Current status: " + reservation.getStatus());
        }

        if (reservation.getExpiresAt() != null && reservation.getExpiresAt().isBefore(LocalDateTime.now())) {
            expireAndRestoreStock(reservation, "Hold expired before pickup readiness");
            throw new BadRequestException("This reservation has expired and can no longer be processed.");
        }

        String oldStatus = reservation.getStatus().name();
        reservation.setStatus(Reservation.Status.READY_FOR_PICKUP);
        Reservation updated = reservationRepository.save(reservation);

        recordStatusHistory(updated, oldStatus, Reservation.Status.READY_FOR_PICKUP.name(), owner, "Packaged and ready for customer counter pickup");
        log.info("Reservation {} marked READY_FOR_PICKUP by pharmacy owner {}", reservation.getReservationCode(), ownerId);

        if (reservation.getUser() != null && notificationService != null) {
            notificationService.createNotification(
                    reservation.getUser(),
                    "Ready for Counter Pickup",
                    "Your medicine " + reservation.getMedicine().getName() + " is packaged and ready for counter pickup at " + pharmacy.getName() + "!",
                    Notification.Type.PICKUP_REMINDER,
                    reservation.getId(),
                    "/dashboard/reservations"
            );
        }

        return toReservationDto(updated);
    }

    @Override
    @Transactional
    public PharmacyReservationDto markReservationCompleted(Long ownerId, Long reservationId) {
        Pharmacy pharmacy = getOwnerPharmacyEntity(ownerId);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found with id: " + ownerId));

        Reservation reservation = reservationRepository.findByIdAndPharmacyId(reservationId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (reservation.getStatus() != Reservation.Status.READY_FOR_PICKUP && reservation.getStatus() != Reservation.Status.CONFIRMED) {
            throw new BadRequestException("Only reservations marked READY_FOR_PICKUP or CONFIRMED can be completed. Current status: " + reservation.getStatus());
        }

        String oldStatus = reservation.getStatus().name();
        reservation.setStatus(Reservation.Status.COMPLETED);
        reservation.setPickedUpAt(LocalDateTime.now());
        Reservation updated = reservationRepository.save(reservation);

        recordStatusHistory(updated, oldStatus, Reservation.Status.COMPLETED.name(), owner, "Dispensed to customer at pharmacy counter");
        log.info("Reservation {} completed (dispensed) by pharmacy owner {}", reservation.getReservationCode(), ownerId);

        if (reservation.getUser() != null && notificationService != null) {
            notificationService.createNotification(
                    reservation.getUser(),
                    "Medicine Dispensed",
                    "Thank you! Your medicine " + reservation.getMedicine().getName() + " was successfully dispensed at " + pharmacy.getName() + ".",
                    Notification.Type.RESERVATION,
                    reservation.getId(),
                    "/dashboard/reservations"
            );
        }

        return toReservationDto(updated);
    }


    private Pharmacy getOwnerPharmacyEntity(Long ownerId) {
        return pharmacyRepository.findFirstByOwnerId(ownerId).orElseGet(() -> {
            User owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));

            String storeName = (owner.getFullName() != null && !owner.getFullName().isBlank())
                    ? owner.getFullName() + "'s Pharmacy"
                    : "My Pharmacy";

            String licenseNum = "LIC-TS-" + Math.abs(10000 + (ownerId.hashCode() % 90000));
            if (pharmacyRepository.existsByLicenseNumber(licenseNum)) {
                licenseNum = "LIC-TS-" + (System.currentTimeMillis() % 1000000);
            }

            Pharmacy initialPharmacy = Pharmacy.builder()
                    .owner(owner)
                    .name(storeName)
                    .licenseNumber(licenseNum)
                    .description("Registered community healthcare pharmacy store.")
                    .addressLine("Main Road")
                    .city("Hyderabad")
                    .state("Telangana")
                    .postalCode("500001")
                    .phone(owner.getPhone() != null && !owner.getPhone().isBlank() ? owner.getPhone() : "9876543210")
                    .email(owner.getEmail())
                    .latitude(17.385044)
                    .longitude(78.486671)
                    .openingTime(java.time.LocalTime.of(8, 0))
                    .closingTime(java.time.LocalTime.of(22, 0))
                    .is24Hours(false)
                    .verificationStatus(Pharmacy.VerificationStatus.VERIFIED)
                    .active(true)
                    .rating(4.5)
                    .build();

            Pharmacy saved = pharmacyRepository.save(initialPharmacy);
            log.info("Auto-provisioned initial pharmacy '{}' for owner ID {}", saved.getName(), ownerId);
            return saved;
        });
    }


    private void expireAndRestoreStock(Reservation reservation, String reason) {
        MedicineStock stock = medicineStockRepository
                .findByPharmacyIdAndMedicineIdForUpdate(reservation.getPharmacy().getId(), reservation.getMedicine().getId())
                .orElse(null);

        if (stock != null) {
            int currentQty = stock.getQuantity() != null ? stock.getQuantity() : 0;
            stock.setQuantity(currentQty + reservation.getQuantity());
            stock.recalculateStatus();
            medicineStockRepository.save(stock);
        }

        reservation.setStatus(Reservation.Status.EXPIRED);
        reservation.setCancellationReason(reason);
        reservationRepository.save(reservation);
    }

    private void recordStatusHistory(Reservation reservation, String oldStatus, String newStatus, User changedBy, String remarks) {
        ReservationStatusHistory history = ReservationStatusHistory.builder()
                .reservation(reservation)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .remarks(remarks)
                .build();
        statusHistoryRepository.save(history);
    }

    private PharmacyProfileResponse toProfileResponse(Pharmacy p) {
        return PharmacyProfileResponse.builder()
                .id(p.getId())
                .ownerId(p.getOwner() != null ? p.getOwner().getId() : null)
                .ownerName(p.getOwner() != null ? p.getOwner().getFullName() : null)
                .name(p.getName())
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
                .rating(p.getRating() != null ? p.getRating() : 0.0)
                .logoUrl(p.getLogoUrl())
                .build();
    }

    private PharmacyInventoryItemDto toInventoryItemDto(MedicineStock ms) {
        Medicine m = ms.getMedicine();
        return PharmacyInventoryItemDto.builder()
                .id(ms.getId())
                .medicineId(m != null ? m.getId() : null)
                .medicineName(m != null ? m.getName() : null)
                .genericName(m != null ? m.getGenericName() : null)
                .manufacturer(m != null ? m.getManufacturer() : null)
                .category(m != null && m.getCategory() != null ? m.getCategory().getName() : null)
                .dosageForm(m != null ? m.getDosageForm() : null)
                .strength(m != null ? m.getStrength() : null)
                .requiresPrescription(m != null && m.isRequiresPrescription())
                .imageUrl(m != null ? m.getImageUrl() : null)
                .quantity(ms.getQuantity())
                .price(ms.getPrice())
                .stockStatus(ms.getStockStatus() != null ? ms.getStockStatus().name() : "OUT_OF_STOCK")
                .lowStockThreshold(ms.getLowStockThreshold())
                .lastRestockedAt(ms.getLastRestockedAt())
                .updatedAt(ms.getUpdatedAt())
                .build();
    }

    private PharmacyReservationDto toReservationDto(Reservation r) {
        User customer = r.getUser();
        Medicine m = r.getMedicine();

        return PharmacyReservationDto.builder()
                .id(r.getId())
                .reservationCode(r.getReservationCode())
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customer != null ? customer.getFullName() : "Valued Customer")
                .customerPhone(customer != null ? customer.getPhone() : null)
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
