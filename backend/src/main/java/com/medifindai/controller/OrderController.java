package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.order.CreateOrderRequest;
import com.medifindai.dto.order.OrderResponse;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully.", response));
    }

    @GetMapping("/my")
    public ApiResponse<List<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<OrderResponse> orders = orderService.getUserOrders(principal.getId());
        return ApiResponse.success(orders);
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrderById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(principal.getId(), id);
        return ApiResponse.success(order);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderResponse> cancelOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        OrderResponse order = orderService.cancelUserOrder(principal.getId(), id, reason);
        return ApiResponse.success("Order cancelled successfully.", order);
    }
}
