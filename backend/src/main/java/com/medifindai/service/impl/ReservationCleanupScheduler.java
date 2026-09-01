package com.medifindai.service.impl;

import com.medifindai.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationCleanupScheduler {

    private final ReservationService reservationService;

    /** Runs every 5 minutes to release expired pending holds. */
    @Scheduled(fixedRateString = "${app.reservation.cleanup-interval-ms:300000}")
    public void cleanupExpiredHolds() {
        try {
            int cleaned = reservationService.cleanupExpiredReservations();
            if (cleaned > 0) {
                log.info("Scheduled job released {} expired medicine reservations.", cleaned);
            }
        } catch (Exception e) {
            log.error("Failed to run scheduled reservation expiration cleanup", e);
        }
    }
}
