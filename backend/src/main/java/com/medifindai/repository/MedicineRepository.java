package com.medifindai.repository;

import com.medifindai.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    @Query("SELECT m FROM Medicine m WHERE LOWER(m.name) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "OR LOWER(m.genericName) LIKE LOWER(CONCAT('%', :term, '%'))")
    Page<Medicine> searchByNameOrGeneric(@Param("term") String term, Pageable pageable);

    java.util.Optional<Medicine> findByBarcode(String barcode);
    boolean existsByBarcode(String barcode);

    @Query("SELECT m FROM Medicine m WHERE " +
           "(:categoryId IS NULL OR m.category.id = :categoryId) AND " +
           "(:search IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.genericName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Medicine> searchMedicinesAdmin(@Param("categoryId") Long categoryId, @Param("search") String search, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);
}



