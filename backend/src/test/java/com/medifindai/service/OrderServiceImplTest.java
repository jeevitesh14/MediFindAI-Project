package com.medifindai.service;

import com.medifindai.dto.order.CreateOrderItemRequest;
import com.medifindai.dto.order.CreateOrderRequest;
import com.medifindai.dto.order.OrderResponse;
import com.medifindai.dto.order.UpdateOrderStatusRequest;
import com.medifindai.entity.*;
import com.medifindai.exception.BadRequestException;
import com.medifindai.repository.*;
import com.medifindai.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;
    @Mock private PharmacyRepository pharmacyRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private MedicineStockRepository stockRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User user;
    private User owner;
    private Pharmacy pharmacy;
    private Medicine medicine;
    private MedicineStock stock;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("user@example.com").fullName("Ravi Kumar").build();
        owner = User.builder().id(2L).email("owner@example.com").fullName("Suresh Reddy").build();
        pharmacy = Pharmacy.builder().id(10L).owner(owner).name("Apollo Pharmacy").active(true).build();
        medicine = Medicine.builder().id(100L).name("Paracetamol 500mg").genericName("Paracetamol").build();
        stock = MedicineStock.builder()
                .id(50L)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(50)
                .price(BigDecimal.valueOf(25.00))
                .stockStatus(MedicineStock.StockStatus.AVAILABLE)
                .build();
    }

    @Test
    void createOrder_homeDelivery_success() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .pharmacyId(10L)
                .deliveryMethod(Order.DeliveryMethod.HOME_DELIVERY)
                .customerName("Ravi Kumar")
                .customerPhone("9876543210")
                .deliveryAddress("Road 1, Banjara Hills")
                .city("Hyderabad")
                .postalCode("500034")
                .paymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY)
                .items(List.of(CreateOrderItemRequest.builder().medicineId(100L).quantity(2).build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(pharmacyRepository.findById(10L)).thenReturn(Optional.of(pharmacy));
        when(medicineRepository.findById(100L)).thenReturn(Optional.of(medicine));
        when(stockRepository.findByPharmacyIdAndMedicineIdForUpdate(10L, 100L)).thenReturn(Optional.of(stock));
        when(orderRepository.existsByOrderNumber(any())).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(1L);
            return o;
        });

        OrderResponse response = orderService.createOrder(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getCustomerName()).isEqualTo("Ravi Kumar");
        assertThat(response.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
        assertThat(response.getDeliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(40.00));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(90.00));
        assertThat(stock.getQuantity()).isEqualTo(48);
    }

    @Test
    void createOrder_insufficientStock_throwsBadRequest() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .pharmacyId(10L)
                .deliveryMethod(Order.DeliveryMethod.HOME_DELIVERY)
                .customerName("Ravi Kumar")
                .customerPhone("9876543210")
                .paymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY)
                .items(List.of(CreateOrderItemRequest.builder().medicineId(100L).quantity(100).build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(pharmacyRepository.findById(10L)).thenReturn(Optional.of(pharmacy));
        when(medicineRepository.findById(100L)).thenReturn(Optional.of(medicine));
        when(stockRepository.findByPharmacyIdAndMedicineIdForUpdate(10L, 100L)).thenReturn(Optional.of(stock));

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void cancelUserOrder_restoresStock() {
        Order order = Order.builder()
                .id(1L)
                .orderNumber("MFA-ORD-123456")
                .user(user)
                .pharmacy(pharmacy)
                .subtotal(BigDecimal.valueOf(50))
                .deliveryFee(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(50))
                .status(Order.Status.PENDING)
                .deliveryMethod(Order.DeliveryMethod.PHARMACY_PICKUP)
                .customerName("Ravi Kumar")
                .customerPhone("9876543210")
                .paymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .build();

        OrderItem item = OrderItem.builder()
                .order(order)
                .medicine(medicine)
                .quantity(3)
                .unitPrice(BigDecimal.valueOf(25))
                .totalPrice(BigDecimal.valueOf(75))
                .build();
        order.addItem(item);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(stockRepository.findByPharmacyIdAndMedicineIdForUpdate(10L, 100L)).thenReturn(Optional.of(stock));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse response = orderService.cancelUserOrder(1L, 1L, "Customer changed mind");

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        assertThat(stock.getQuantity()).isEqualTo(53); // 50 + 3 restored
    }
}
