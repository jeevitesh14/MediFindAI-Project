package com.medifindai.dto.order;

import com.medifindai.entity.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotNull(message = "Pharmacy ID is required.")
    private Long pharmacyId;

    @NotNull(message = "Delivery method is required.")
    private Order.DeliveryMethod deliveryMethod;

    @NotBlank(message = "Customer name is required.")
    private String customerName;

    @NotBlank(message = "Contact phone number is required.")
    private String customerPhone;

    private String deliveryAddress;
    private String landmark;
    private String city;
    private String postalCode;

    @NotNull(message = "Payment method is required.")
    private Order.PaymentMethod paymentMethod;

    @NotEmpty(message = "Order must contain at least one item.")
    @Valid
    private List<CreateOrderItemRequest> items;
}
