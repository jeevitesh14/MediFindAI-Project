package com.medifindai.repository;

import com.medifindai.entity.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    Page<Reservation> findByUserId(Long userId, Pageable pageable);
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Reservation> findByPharmacyId(Long pharmacyId, Pageable pageable);
    List<Reservation> findByPharmacyIdOrderByCreatedAtDesc(Long pharmacyId);
    List<Reservation> findByPharmacyIdAndStatusOrderByCreatedAtDesc(Long pharmacyId, Reservation.Status status);
    Optional<Reservation> findByIdAndUserId(Long id, Long userId);
    Optional<Reservation> findByIdAndPharmacyId(Long id, Long pharmacyId);
    Optional<Reservation> findByReservationCode(String reservationCode);
    boolean existsByReservationCode(String reservationCode);
    List<Reservation> findByStatusAndExpiresAtBefore(Reservation.Status status, LocalDateTime dateTime);

    int countByPharmacyId(Long pharmacyId);
    int countByPharmacyIdAndStatus(Long pharmacyId, Reservation.Status status);
    long countByStatus(Reservation.Status status);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE " +
            "(:status IS NULL OR r.status = :status) AND " +
            "(:search IS NULL OR LOWER(r.reservationCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(r.medicine.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(r.pharmacy.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(r.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Reservation> searchReservationsAdmin(@org.springframework.data.repository.query.Param("status") Reservation.Status status,
                                             @org.springframework.data.repository.query.Param("search") String search,
                                             Pageable pageable);
}



