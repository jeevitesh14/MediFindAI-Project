package com.medifindai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "medicine_stock", uniqueConstraints = @UniqueConstraint(columnNames = {"pharmacy_id", "medicine_id"}))
public class MedicineStock extends BaseEntity {

    public enum StockStatus { AVAILABLE, LOW_STOCK, OUT_OF_STOCK }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacy_id", nullable = false)
    private Pharmacy pharmacy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Builder.Default
    private Integer quantity = 0;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "stock_status", nullable = false, length = 20)
    @Builder.Default
    private StockStatus stockStatus = StockStatus.OUT_OF_STOCK;

    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 10;

    @Column(name = "last_restocked_at")
    private LocalDateTime lastRestockedAt;

    /** Recomputes stockStatus from quantity vs threshold. Call after any quantity change. */
    public void recalculateStatus() {
        if (quantity == null || quantity <= 0) {
            stockStatus = StockStatus.OUT_OF_STOCK;
        } else if (quantity <= lowStockThreshold) {
            stockStatus = StockStatus.LOW_STOCK;
        } else {
            stockStatus = StockStatus.AVAILABLE;
        }
    }
}
