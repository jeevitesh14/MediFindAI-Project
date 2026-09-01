package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.order.CreateOrderItemRequest;
import com.medifindai.dto.order.CreateOrderRequest;
import com.medifindai.dto.order.OrderResponse;
import com.medifindai.entity.Order;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private UserPrincipal userPrincipal;
    private OrderResponse sampleOrder;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).email("ravi@example.com").role(Role.USER).build();
        userPrincipal = new UserPrincipal(user);

        sampleOrder = OrderResponse.builder()
                .id(10L)
                .orderNumber("MFA-ORD-ABC123")
                .totalAmount(BigDecimal.valueOf(140.00))
                .status("PENDING")
                .deliveryMethod("HOME_DELIVERY")
                .build();
    }

    @Test
    void createOrder_success() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .pharmacyId(5L)
                .deliveryMethod(Order.DeliveryMethod.HOME_DELIVERY)
                .customerName("Ravi")
                .customerPhone("9876543210")
                .paymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY)
                .items(List.of(CreateOrderItemRequest.builder().medicineId(1L).quantity(2).build()))
                .build();

        when(orderService.createOrder(eq(1L), any(CreateOrderRequest.class))).thenReturn(sampleOrder);

        ResponseEntity<ApiResponse<OrderResponse>> response = orderController.createOrder(userPrincipal, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getData().getOrderNumber()).isEqualTo("MFA-ORD-ABC123");
    }

    @Test
    void getMyOrders_success() {
        when(orderService.getUserOrders(1L)).thenReturn(List.of(sampleOrder));

        ApiResponse<List<OrderResponse>> response = orderController.getMyOrders(userPrincipal);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).hasSize(1);
    }
}
