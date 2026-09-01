package com.medifindai.repository;

import com.medifindai.entity.Pharmacy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {
    Page<Pharmacy> findByOwnerId(Long ownerId, Pageable pageable);
    List<Pharmacy> findByOwnerId(Long ownerId);
    Optional<Pharmacy> findFirstByOwnerId(Long ownerId);
    Optional<Pharmacy> findByIdAndOwnerId(Long id, Long ownerId);
    Page<Pharmacy> findByVerificationStatus(Pharmacy.VerificationStatus status, Pageable pageable);
    List<Pharmacy> findByActiveTrueAndVerificationStatus(Pharmacy.VerificationStatus status);
    boolean existsByLicenseNumber(String licenseNumber);
    long countByVerificationStatus(Pharmacy.VerificationStatus status);

    @Query("SELECT p FROM Pharmacy p WHERE " +
            "(:status IS NULL OR p.verificationStatus = :status) AND " +
            "(:search IS NULL OR " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.city) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.addressLine) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.state) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.licenseNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Pharmacy> searchPharmaciesAdmin(@Param("status") Pharmacy.VerificationStatus status,
                                         @Param("search") String search,
                                         Pageable pageable);
}
