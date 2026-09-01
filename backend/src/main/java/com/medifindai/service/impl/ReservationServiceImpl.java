package com.medifindai.service.impl;

import com.medifindai.dto.reservation.CreateReservationRequest;
import com.medifindai.dto.reservation.ReservationResponse;
import com.medifindai.entity.*;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.exception.UnauthorizedException;
import com.medifindai.repository.*;
import com.medifindai.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ReservationRepository reservationRepository;
    private final ReservationStatusHistoryRepository statusHistoryRepository;
    private final MedicineStockRepository medicineStockRepository;
    private final MedicineRepository medicineRepository;
    private final PharmacyRepository pharmacyRepository;
    private final UserRepository userRepository;
    private final com.medifindai.service.NotificationService notificationService;

    @Value("${app.reservation.expiry-hours:24}")
    private int expiryHours = 24;


    @Override
    @Transactional
    public ReservationResponse createReservation(Long userId, CreateReservationRequest request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new BadRequestException("Quantity must be at least 1.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + request.getMedicineId()));

        Pharmacy pharmacy = pharmacyRepository.findById(request.getPharmacyId())
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + request.getPharmacyId()));

        if (!pharmacy.isActive()) {
            throw new BadRequestException("Selected pharmacy is currently inactive.");
        }

        // Concurrency-safe lock and deduct stock
        MedicineStock stock = medicineStockRepository
                .findByPharmacyIdAndMedicineIdForUpdate(pharmacy.getId(), medicine.getId())
                .orElseThrow(() -> new BadRequestException("Selected medicine is not stocked at this pharmacy."));

        if (stock.getQuantity() == null || stock.getQuantity() < request.getQuantity() || stock.getQuantity() <= 0) {
            int available = stock.getQuantity() != null ? Math.max(0, stock.getQuantity()) : 0;
            throw new BadRequestException("Insufficient stock available at " + pharmacy.getName() +
                    ". Requested: " + request.getQuantity() + ", Available: " + available);
        }

        // Deduct inventory and recalculate status
        stock.setQuantity(stock.getQuantity() - request.getQuantity());
        stock.recalculateStatus();
        medicineStockRepository.save(stock);

        // Generate unique reservation code and compute pricing
        String reservationCode = generateUniqueReservationCode();
        BigDecimal unitPrice = stock.getPrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(expiryHours);

        Reservation reservation = Reservation.builder()
                .reservationCode(reservationCode)
                .user(user)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(request.getQuantity())
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .status(Reservation.Status.PENDING)
                .expiresAt(expiresAt)
                .build();

        Reservation savedReservation = reservationRepository.save(reservation);

        // Notify Pharmacy Owner
        if (pharmacy.getOwner() != null) {
            notificationService.createNotification(
                    pharmacy.getOwner(),
                    "New Medicine Hold Request",
                    "Customer " + user.getFullName() + " placed a 24-hour hold for " + medicine.getName() + " (Qty: " + request.getQuantity() + ", Code: " + reservationCode + ").",
                    Notification.Type.RESERVATION,
                    savedReservation.getId(),
                    "/pharmacy-owner/reservations"
            );
        }

        // Log initial status history
        ReservationStatusHistory history = ReservationStatusHistory.builder()
                .reservation(savedReservation)
                .oldStatus(null)
                .newStatus(Reservation.Status.PENDING.name())
                .changedBy(user)
                .remarks("Medicine reserved online by customer")
                .build();
        statusHistoryRepository.save(history);

        log.info("Created reservation {} for user {} at pharmacy {} for medicine {} (Qty: {})",
                reservationCode, userId, pharmacy.getId(), medicine.getId(), request.getQuantity());

        return toResponse(savedReservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserReservations(Long userId) {
        return reservationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long userId, Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (!reservation.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to view this reservation.");
        }

        return toResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse cancelReservation(Long userId, Long reservationId, String reason) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        if (!reservation.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to cancel this reservation.");
        }

        if (reservation.getStatus() != Reservation.Status.PENDING && reservation.getStatus() != Reservation.Status.CONFIRMED) {
            throw new BadRequestException("Reservation cannot be cancelled in its current status: " + reservation.getStatus());
        }

        String oldStatus = reservation.getStatus().name();
        String cancelReason = (reason != null && !reason.isBlank()) ? reason.trim() : "Cancelled by customer";

        // Restore inventory and recalculate stock status
        MedicineStock stock = medicineStockRepository
                .findByPharmacyIdAndMedicineIdForUpdate(reservation.getPharmacy().getId(), reservation.getMedicine().getId())
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

        // Notify Pharmacy Owner of customer cancellation
        if (reservation.getPharmacy() != null && reservation.getPharmacy().getOwner() != null) {
            notificationService.createNotification(
                    reservation.getPharmacy().getOwner(),
                    "Reservation Cancelled",
                    "Reservation " + reservation.getReservationCode() + " for " + reservation.getMedicine().getName() + " was cancelled by customer.",
                    Notification.Type.RESERVATION,
                    reservation.getId(),
                    "/pharmacy-owner/reservations"
            );
        }

        // Record status history
        ReservationStatusHistory history = ReservationStatusHistory.builder()
                .reservation(updated)
                .oldStatus(oldStatus)
                .newStatus(Reservation.Status.CANCELLED.name())
                .changedBy(reservation.getUser())
                .remarks(cancelReason)
                .build();
        statusHistoryRepository.save(history);

        log.info("Cancelled reservation {} by user {} - Stock restored (Qty: {})",
                reservation.getReservationCode(), userId, reservation.getQuantity());

        return toResponse(updated);
    }

    @Override
    @Transactional
    public int cleanupExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> expiredList = reservationRepository
                .findByStatusAndExpiresAtBefore(Reservation.Status.PENDING, now);

        int count = 0;
        for (Reservation r : expiredList) {
            MedicineStock stock = medicineStockRepository
                    .findByPharmacyIdAndMedicineIdForUpdate(r.getPharmacy().getId(), r.getMedicine().getId())
                    .orElse(null);

            if (stock != null) {
                int currentQty = stock.getQuantity() != null ? stock.getQuantity() : 0;
                stock.setQuantity(currentQty + r.getQuantity());
                stock.recalculateStatus();
                medicineStockRepository.save(stock);
            }

            r.setStatus(Reservation.Status.EXPIRED);
            r.setCancellationReason("Automatically expired after " + expiryHours + "-hour hold window");
            reservationRepository.save(r);

            if (r.getUser() != null && notificationService != null) {
                notificationService.createNotification(
                        r.getUser(),
                        "Reservation Expired",
                        "Your hold for " + r.getMedicine().getName() + " at " + r.getPharmacy().getName() + " has expired.",
                        Notification.Type.RESERVATION,
                        r.getId(),
                        "/dashboard/reservations"
                );
            }

            ReservationStatusHistory history = ReservationStatusHistory.builder()
                    .reservation(r)
                    .oldStatus(Reservation.Status.PENDING.name())
                    .newStatus(Reservation.Status.EXPIRED.name())
                    .changedBy(null)
                    .remarks("Automated system expiration cleanup")
                    .build();
            statusHistoryRepository.save(history);
            count++;
        }


        if (count > 0) {
            log.info("Cleaned up {} expired reservations and restored inventory.", count);
        }
        return count;
    }

    private String generateUniqueReservationCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder("MFA-");
            for (int i = 0; i < CODE_LENGTH; i++) {
                int idx = RANDOM.nextInt(CODE_ALPHABET.length());
                sb.append(CODE_ALPHABET.charAt(idx));
            }
            String code = sb.toString();
            if (!reservationRepository.existsByReservationCode(code)) {
                return code;
            }
        }
        return "MFA-" + System.currentTimeMillis();
    }

    private ReservationResponse toResponse(Reservation r) {
        return ReservationResponse.builder()
                .id(r.getId())
                .reservationCode(r.getReservationCode())
                .medicineId(r.getMedicine() != null ? r.getMedicine().getId() : null)
                .medicineName(r.getMedicine() != null ? r.getMedicine().getName() : null)
                .genericName(r.getMedicine() != null ? r.getMedicine().getGenericName() : null)
                .strength(r.getMedicine() != null ? r.getMedicine().getStrength() : null)
                .dosageForm(r.getMedicine() != null ? r.getMedicine().getDosageForm() : null)
                .requiresPrescription(r.getMedicine() != null && r.getMedicine().isRequiresPrescription())
                .pharmacyId(r.getPharmacy() != null ? r.getPharmacy().getId() : null)
                .pharmacyName(r.getPharmacy() != null ? r.getPharmacy().getName() : null)
                .pharmacyAddress(r.getPharmacy() != null ? r.getPharmacy().getAddressLine() : null)
                .pharmacyCity(r.getPharmacy() != null ? r.getPharmacy().getCity() : null)
                .quantity(r.getQuantity())
                .unitPrice(r.getUnitPrice())
                .totalPrice(r.getTotalPrice())
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .createdAt(r.getCreatedAt())
                .expiresAt(r.getExpiresAt())
                .pickedUpAt(r.getPickedUpAt())
                .cancellationReason(r.getCancellationReason())
                .build();
    }
}
