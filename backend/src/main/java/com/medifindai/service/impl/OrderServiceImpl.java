package com.medifindai.service.impl;

import com.medifindai.dto.order.*;
import com.medifindai.entity.*;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.exception.UnauthorizedException;
import com.medifindai.repository.*;
import com.medifindai.service.NotificationService;
import com.medifindai.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final String ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository stockRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one medicine item.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Pharmacy pharmacy = pharmacyRepository.findById(request.getPharmacyId())
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy not found with id: " + request.getPharmacyId()));

        if (!pharmacy.isActive()) {
            throw new BadRequestException("Selected pharmacy '" + pharmacy.getName() + "' is currently not accepting orders.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        // Lock inventory and deduct stock safely
        for (CreateOrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() < 1) {
                throw new BadRequestException("Item quantity must be at least 1.");
            }

            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + itemReq.getMedicineId()));

            MedicineStock stock = stockRepository
                    .findByPharmacyIdAndMedicineIdForUpdate(pharmacy.getId(), medicine.getId())
                    .orElseThrow(() -> new BadRequestException("Medicine '" + medicine.getName() + "' is not stocked at " + pharmacy.getName()));

            if (stock.getQuantity() == null || stock.getQuantity() < itemReq.getQuantity() || stock.getQuantity() <= 0) {
                int available = stock.getQuantity() != null ? Math.max(0, stock.getQuantity()) : 0;
                throw new BadRequestException("Insufficient stock for '" + medicine.getName() + "'. Requested: " +
                        itemReq.getQuantity() + ", Available: " + available);
            }

            // Deduct stock and recalculate status
            stock.setQuantity(stock.getQuantity() - itemReq.getQuantity());
            stock.recalculateStatus();
            stockRepository.save(stock);

            BigDecimal unitPrice = stock.getPrice() != null ? stock.getPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .medicine(medicine)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .build();

            orderItems.add(orderItem);

            // Low stock warning notification for owner if needed
            if ((stock.getStockStatus() == MedicineStock.StockStatus.LOW_STOCK ||
                 stock.getStockStatus() == MedicineStock.StockStatus.OUT_OF_STOCK) &&
                pharmacy.getOwner() != null && notificationService != null) {
                notificationService.createNotification(
                        pharmacy.getOwner(),
                        "Low Stock Alert: " + medicine.getName(),
                        "Inventory level for " + medicine.getName() + " dropped to " + stock.getQuantity() + " (" + stock.getStockStatus() + ").",
                        Notification.Type.STOCK_ALERT,
                        stock.getId(),
                        "/pharmacy-owner/inventory"
                );
            }
        }

        BigDecimal deliveryFee = request.getDeliveryMethod() == Order.DeliveryMethod.HOME_DELIVERY
                ? BigDecimal.valueOf(40.00)
                : BigDecimal.ZERO;

        BigDecimal totalAmount = subtotal.add(deliveryFee);
        String orderNumber = generateUniqueOrderNumber();
        String pickupCode = request.getDeliveryMethod() == Order.DeliveryMethod.PHARMACY_PICKUP
                ? "PKP-" + (1000 + RANDOM.nextInt(9000))
                : null;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .pharmacy(pharmacy)
                .subtotal(subtotal)
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .status(Order.Status.PENDING)
                .deliveryMethod(request.getDeliveryMethod())
                .customerName(request.getCustomerName().trim())
                .customerPhone(request.getCustomerPhone().trim())
                .deliveryAddress(request.getDeliveryAddress() != null ? request.getDeliveryAddress().trim() : null)
                .landmark(request.getLandmark() != null ? request.getLandmark().trim() : null)
                .city(request.getCity() != null ? request.getCity().trim() : null)
                .postalCode(request.getPostalCode() != null ? request.getPostalCode().trim() : null)
                .pickupCode(pickupCode)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(request.getPaymentMethod() == Order.PaymentMethod.ONLINE_MOCK ? Order.PaymentStatus.PAID : Order.PaymentStatus.PENDING)
                .build();

        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        Order saved = orderRepository.save(order);
        log.info("Created order {} for user {} at pharmacy {} (Total: ₹{})",
                orderNumber, userId, pharmacy.getId(), totalAmount);

        // Notify Pharmacy Owner
        if (pharmacy.getOwner() != null && notificationService != null) {
            notificationService.createNotification(
                    pharmacy.getOwner(),
                    "New Online Order: " + orderNumber,
                    "Customer " + request.getCustomerName() + " placed a " + request.getDeliveryMethod() + " order (Total: ₹" + totalAmount + ").",
                    Notification.Type.SYSTEM,
                    saved.getId(),
                    "/pharmacy-owner/orders"
            );
        }

        // Notify Customer
        if (notificationService != null) {
            notificationService.createNotification(
                    user,
                    "Order Placed Successfully",
                    "Your order " + orderNumber + " at " + pharmacy.getName() + " has been received and is pending confirmation.",
                    Notification.Type.SYSTEM,
                    saved.getId(),
                    "/dashboard/orders"
            );
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to view this order.");
        }

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelUserOrder(Long userId, Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to cancel this order.");
        }

        if (order.getStatus() != Order.Status.PENDING && order.getStatus() != Order.Status.CONFIRMED) {
            throw new BadRequestException("Order cannot be cancelled in its current status: " + order.getStatus());
        }

        restoreStock(order);

        order.setStatus(Order.Status.CANCELLED);
        order.setCancellationReason((reason != null && !reason.isBlank()) ? reason.trim() : "Cancelled by customer");
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        }

        Order saved = orderRepository.save(order);
        log.info("Cancelled order {} by user {}", order.getOrderNumber(), userId);

        if (order.getPharmacy().getOwner() != null && notificationService != null) {
            notificationService.createNotification(
                    order.getPharmacy().getOwner(),
                    "Order Cancelled: " + order.getOrderNumber(),
                    "Order " + order.getOrderNumber() + " was cancelled by customer. Stock restored.",
                    Notification.Type.SYSTEM,
                    saved.getId(),
                    "/pharmacy-owner/orders"
            );
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getPharmacyOrders(Long ownerId, Order.Status status) {
        Pharmacy pharmacy = getOwnerPharmacy(ownerId);
        if (status != null) {
            return orderRepository.findByPharmacyIdAndStatusOrderByCreatedAtDesc(pharmacy.getId(), status)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }
        return orderRepository.findByPharmacyIdOrderByCreatedAtDesc(pharmacy.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public OrderResponse updatePharmacyOrderStatus(Long ownerId, Long orderId, UpdateOrderStatusRequest request) {
        Pharmacy pharmacy = getOwnerPharmacy(ownerId);
        Order order = orderRepository.findByIdAndPharmacyId(orderId, pharmacy.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        Order.Status newStatus = request.getStatus();

        if (newStatus == Order.Status.CANCELLED) {
            restoreStock(order);
            order.setCancellationReason(request.getCancellationReason() != null ? request.getCancellationReason().trim() : "Rejected by pharmacy");
            if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
                order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
            }
        } else if (newStatus == Order.Status.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
            if (order.getPaymentStatus() == Order.PaymentStatus.PENDING) {
                order.setPaymentStatus(Order.PaymentStatus.PAID);
            }
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        log.info("Pharmacy owner {} updated order {} status to {}", ownerId, order.getOrderNumber(), newStatus);

        // Notify customer
        if (order.getUser() != null && notificationService != null) {
            String title = "Order Update: " + newStatus;
            String msg = "Your order " + order.getOrderNumber() + " from " + pharmacy.getName() + " is now " + newStatus + ".";
            if (newStatus == Order.Status.READY) {
                msg = order.getDeliveryMethod() == Order.DeliveryMethod.PHARMACY_PICKUP
                        ? "Your order " + order.getOrderNumber() + " is packaged and ready for counter pickup (Code: " + order.getPickupCode() + ")!"
                        : "Your order " + order.getOrderNumber() + " is packaged and ready for delivery!";
            } else if (newStatus == Order.Status.DELIVERED) {
                msg = "Your order " + order.getOrderNumber() + " was successfully delivered/collected. Thank you for choosing MediFindAI!";
            }

            notificationService.createNotification(
                    order.getUser(),
                    title,
                    msg,
                    Notification.Type.SYSTEM,
                    saved.getId(),
                    "/dashboard/orders"
            );
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAdminOrders(Order.Status status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return orderRepository.searchOrdersAdmin(status, cleanSearch, pageable)
                .map(this::toResponse);
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            MedicineStock stock = stockRepository
                    .findByPharmacyIdAndMedicineIdForUpdate(order.getPharmacy().getId(), item.getMedicine().getId())
                    .orElse(null);

            if (stock != null) {
                int current = stock.getQuantity() != null ? stock.getQuantity() : 0;
                stock.setQuantity(current + item.getQuantity());
                stock.recalculateStatus();
                stockRepository.save(stock);
            }
        }
    }

    private Pharmacy getOwnerPharmacy(Long ownerId) {
        return pharmacyRepository.findFirstByOwnerId(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacy profile not found for owner ID: " + ownerId));
    }

    private String generateUniqueOrderNumber() {
        for (int i = 0; i < 10; i++) {
            StringBuilder sb = new StringBuilder("MFA-ORD-");
            for (int j = 0; j < 6; j++) {
                sb.append(ORDER_CODE_ALPHABET.charAt(RANDOM.nextInt(ORDER_CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!orderRepository.existsByOrderNumber(code)) {
                return code;
            }
        }
        return "MFA-ORD-" + System.currentTimeMillis();
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemDto> itemDtos = o.getItems().stream().map(item -> OrderItemDto.builder()
                .id(item.getId())
                .medicineId(item.getMedicine().getId())
                .medicineName(item.getMedicine().getName())
                .genericName(item.getMedicine().getGenericName())
                .strength(item.getMedicine().getStrength())
                .dosageForm(item.getMedicine().getDosageForm())
                .requiresPrescription(item.getMedicine().isRequiresPrescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build()).toList();

        return OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .customerId(o.getUser() != null ? o.getUser().getId() : null)
                .customerName(o.getCustomerName())
                .customerPhone(o.getCustomerPhone())
                .customerEmail(o.getUser() != null ? o.getUser().getEmail() : null)
                .pharmacyId(o.getPharmacy() != null ? o.getPharmacy().getId() : null)
                .pharmacyName(o.getPharmacy() != null ? o.getPharmacy().getName() : null)
                .pharmacyPhone(o.getPharmacy() != null ? o.getPharmacy().getPhone() : null)
                .pharmacyAddress(o.getPharmacy() != null ? o.getPharmacy().getAddressLine() : null)
                .pharmacyCity(o.getPharmacy() != null ? o.getPharmacy().getCity() : null)
                .subtotal(o.getSubtotal())
                .deliveryFee(o.getDeliveryFee())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus() != null ? o.getStatus().name() : "PENDING")
                .deliveryMethod(o.getDeliveryMethod() != null ? o.getDeliveryMethod().name() : "HOME_DELIVERY")
                .deliveryAddress(o.getDeliveryAddress())
                .landmark(o.getLandmark())
                .city(o.getCity())
                .postalCode(o.getPostalCode())
                .pickupCode(o.getPickupCode())
                .paymentMethod(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "CASH_ON_DELIVERY")
                .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "PENDING")
                .cancellationReason(o.getCancellationReason())
                .createdAt(o.getCreatedAt())
                .deliveredAt(o.getDeliveredAt())
                .items(itemDtos)
                .build();
    }
}
