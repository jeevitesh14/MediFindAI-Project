package com.medifindai.repository;

import com.medifindai.entity.MedicineCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineCategoryRepository extends JpaRepository<MedicineCategory, Long> {
}
