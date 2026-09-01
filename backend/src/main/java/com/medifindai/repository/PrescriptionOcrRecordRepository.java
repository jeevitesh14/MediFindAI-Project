package com.medifindai.repository;

import com.medifindai.entity.PrescriptionOcrRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrescriptionOcrRecordRepository extends JpaRepository<PrescriptionOcrRecord, Long> {

    List<PrescriptionOcrRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<PrescriptionOcrRecord> findByIdAndUserId(Long id, Long userId);
}

