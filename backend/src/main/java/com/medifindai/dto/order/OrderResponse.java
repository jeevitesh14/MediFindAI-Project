package com.medifindai.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;

    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    private Long pharmacyId;
    private String pharmacyName;
    private String pharmacyPhone;
    private String pharmacyAddress;
    private String pharmacyCity;

    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;

    private String status;
    private String deliveryMethod;

    private String deliveryAddress;
    private String landmark;
    private String city;
    private String postalCode;

    private String pickupCode;
    private String paymentMethod;
    private String paymentStatus;
    private String cancellationReason;

    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;

    private List<OrderItemDto> items;
}
