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
    boolean existsByLicenseNumberAndIdNot(String licenseNumber, Long id);
    long countByVerificationStatus(Pharmacy.VerificationStatus status);
    long countByActiveTrue();
    long countByActiveFalse();
    List<Pharmacy> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Pharmacy p LEFT JOIN p.owner o WHERE " +
            "(:status IS NULL OR p.verificationStatus = :status) AND " +
            "(:active IS NULL OR p.active = :active) AND " +
            "(:search IS NULL OR " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.city) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.addressLine) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.state) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.licenseNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Pharmacy> searchPharmaciesAdmin(@Param("status") Pharmacy.VerificationStatus status,
                                         @Param("active") Boolean active,
                                         @Param("search") String search,
                                         Pageable pageable);
}
