package com.medifindai.service;

import com.medifindai.dto.order.CreateOrderRequest;
import com.medifindai.dto.order.OrderResponse;
import com.medifindai.dto.order.UpdateOrderStatusRequest;
import com.medifindai.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(Long userId, CreateOrderRequest request);
    List<OrderResponse> getUserOrders(Long userId);
    OrderResponse getOrderById(Long userId, Long orderId);
    OrderResponse cancelUserOrder(Long userId, Long orderId, String reason);

    List<OrderResponse> getPharmacyOrders(Long ownerId, Order.Status status);
    OrderResponse updatePharmacyOrderStatus(Long ownerId, Long orderId, UpdateOrderStatusRequest request);

    Page<OrderResponse> getAdminOrders(Order.Status status, String search, Pageable pageable);
}
