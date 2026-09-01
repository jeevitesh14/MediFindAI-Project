package com.medifindai.dto.pharmacyowner;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInventoryRequest {

    @NotNull(message = "Quantity is required.")
    @Min(value = 0, message = "Quantity cannot be negative.")
    private Integer quantity;

    @NotNull(message = "Price is required.")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero.")
    private BigDecimal price;

    @Min(value = 1, message = "Low stock threshold must be at least 1.")
    @Builder.Default
    private Integer lowStockThreshold = 10;
}
