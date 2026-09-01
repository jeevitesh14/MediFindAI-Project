package com.medifindai.repository;

import com.medifindai.entity.ReservationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ReservationStatusHistoryRepository extends JpaRepository<ReservationStatusHistory, Long> {
    List<ReservationStatusHistory> findByReservationIdOrderByCreatedAtAsc(Long reservationId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ReservationStatusHistory rsh WHERE rsh.reservation.id = :reservationId")
    void deleteByReservationId(@Param("reservationId") Long reservationId);
}
