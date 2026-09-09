package com.medifindai.repository;

import com.medifindai.entity.MedicineStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicineStockRepository extends JpaRepository<MedicineStock, Long> {
    List<MedicineStock> findByMedicineId(Long medicineId);

    @Query("SELECT ms FROM MedicineStock ms JOIN FETCH ms.pharmacy p WHERE ms.medicine.id = :medicineId")
    List<MedicineStock> findByMedicineIdWithPharmacy(@Param("medicineId") Long medicineId);

    List<MedicineStock> findByPharmacyId(Long pharmacyId);
    List<MedicineStock> findByPharmacyIdOrderByUpdatedAtDesc(Long pharmacyId);
    List<MedicineStock> findByPharmacyIdAndStockStatus(Long pharmacyId, MedicineStock.StockStatus stockStatus);
    Optional<MedicineStock> findByPharmacyIdAndMedicineId(Long pharmacyId, Long medicineId);
    Optional<MedicineStock> findByIdAndPharmacyId(Long id, Long pharmacyId);
    boolean existsByPharmacyIdAndMedicineId(Long pharmacyId, Long medicineId);

    int countByPharmacyId(Long pharmacyId);
    int countByPharmacyIdAndStockStatus(Long pharmacyId, MedicineStock.StockStatus stockStatus);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM MedicineStock ms WHERE ms.pharmacy.id = :pharmacyId")
    void deleteByPharmacyId(@Param("pharmacyId") Long pharmacyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ms FROM MedicineStock ms WHERE ms.pharmacy.id = :pharmacyId AND ms.medicine.id = :medicineId")
    Optional<MedicineStock> findByPharmacyIdAndMedicineIdForUpdate(
            @Param("pharmacyId") Long pharmacyId,
            @Param("medicineId") Long medicineId
    );
}


