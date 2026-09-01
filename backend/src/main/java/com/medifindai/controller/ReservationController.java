package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.reservation.CancelReservationRequest;
import com.medifindai.dto.reservation.CreateReservationRequest;
import com.medifindai.dto.reservation.ReservationResponse;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReservationRequest request) {

        ReservationResponse response = reservationService.createReservation(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medicine reserved successfully for 24-hour hold.", response));
    }

    @GetMapping("/my")
    public ApiResponse<List<ReservationResponse>> getMyReservations(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<ReservationResponse> responses = reservationService.getUserReservations(principal.getId());
        return ApiResponse.success(responses);
    }

    @GetMapping("/{id}")
    public ApiResponse<ReservationResponse> getReservationById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        ReservationResponse response = reservationService.getReservationById(principal.getId(), id);
        return ApiResponse.success(response);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<ReservationResponse> cancelReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) CancelReservationRequest cancelRequest) {

        String reason = cancelRequest != null ? cancelRequest.getReason() : null;
        ReservationResponse response = reservationService.cancelReservation(principal.getId(), id, reason);
        return ApiResponse.success("Reservation cancelled and stock restored successfully.", response);
    }
}
