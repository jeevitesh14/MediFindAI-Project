package com.medifindai.repository;

import com.medifindai.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByUserIdAndPurposeOrderByCreatedAtDesc(Long userId, OtpVerification.Purpose purpose);
}
