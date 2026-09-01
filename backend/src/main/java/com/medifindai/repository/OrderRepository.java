package com.medifindai.repository;

import com.medifindai.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByPharmacyIdOrderByCreatedAtDesc(Long pharmacyId);
    List<Order> findByPharmacyIdAndStatusOrderByCreatedAtDesc(Long pharmacyId, Order.Status status);
    Optional<Order> findByIdAndUserId(Long id, Long userId);
    Optional<Order> findByIdAndPharmacyId(Long id, Long pharmacyId);
    Optional<Order> findByOrderNumber(String orderNumber);
    boolean existsByOrderNumber(String orderNumber);

    long countByPharmacyId(Long pharmacyId);
    long countByPharmacyIdAndStatus(Long pharmacyId, Order.Status status);
    long countByStatus(Order.Status status);

    @Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:search IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.pharmacy.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchOrdersAdmin(@Param("status") Order.Status status,
                                  @Param("search") String search,
                                  Pageable pageable);
}
