package com.medifindai.service;

import com.medifindai.dto.reservation.CreateReservationRequest;
import com.medifindai.dto.reservation.ReservationResponse;

import java.util.List;

public interface ReservationService {

    ReservationResponse createReservation(Long userId, CreateReservationRequest request);

    List<ReservationResponse> getUserReservations(Long userId);

    ReservationResponse getReservationById(Long userId, Long reservationId);

    ReservationResponse cancelReservation(Long userId, Long reservationId, String reason);

    int cleanupExpiredReservations();
}
