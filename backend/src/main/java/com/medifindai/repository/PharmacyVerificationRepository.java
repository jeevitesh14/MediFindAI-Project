package com.medifindai.repository;

import com.medifindai.entity.PharmacyVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface PharmacyVerificationRepository extends JpaRepository<PharmacyVerification, Long> {
    @Modifying
    @Transactional
    @Query("DELETE FROM PharmacyVerification pv WHERE pv.pharmacy.id = :pharmacyId")
    void deleteByPharmacyId(@Param("pharmacyId") Long pharmacyId);
}
