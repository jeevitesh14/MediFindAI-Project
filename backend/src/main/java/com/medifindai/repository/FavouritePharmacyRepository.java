package com.medifindai.repository;

import com.medifindai.entity.FavouritePharmacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface FavouritePharmacyRepository extends JpaRepository<FavouritePharmacy, Long> {
    List<FavouritePharmacy> findByUserId(Long userId);
    boolean existsByUserIdAndPharmacyId(Long userId, Long pharmacyId);

    @Modifying
    @Transactional
    @Query("DELETE FROM FavouritePharmacy fp WHERE fp.pharmacy.id = :pharmacyId")
    void deleteByPharmacyId(@Param("pharmacyId") Long pharmacyId);
}
