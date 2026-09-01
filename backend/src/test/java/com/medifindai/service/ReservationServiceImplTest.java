package com.medifindai.service;

import com.medifindai.dto.reservation.CreateReservationRequest;
import com.medifindai.dto.reservation.ReservationResponse;
import com.medifindai.entity.*;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.exception.UnauthorizedException;
import com.medifindai.repository.*;
import com.medifindai.service.impl.ReservationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private ReservationStatusHistoryRepository statusHistoryRepository;
    @Mock private MedicineStockRepository medicineStockRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private PharmacyRepository pharmacyRepository;
    @Mock private UserRepository userRepository;
    @Mock private com.medifindai.service.NotificationService notificationService;

    @InjectMocks
    private ReservationServiceImpl reservationService;


    private User user;
    private Medicine medicine;
    private Pharmacy pharmacy;
    private MedicineStock stock;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(reservationService, "expiryHours", 24);

        user = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("John Doe")
                .role(Role.USER)
                .active(true)
                .build();

        medicine = Medicine.builder()
                .id(10L)
                .name("Paracetamol 500mg")
                .genericName("Paracetamol")
                .dosageForm("Tablet")
                .strength("500mg")
                .requiresPrescription(false)
                .build();

        pharmacy = Pharmacy.builder()
                .id(20L)
                .name("Apollo Care Pharmacy")
                .addressLine("123 Main Street")
                .city("Hyderabad")
                .active(true)
                .build();

        stock = MedicineStock.builder()
                .id(30L)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(50)
                .price(new BigDecimal("25.00"))
                .stockStatus(MedicineStock.StockStatus.AVAILABLE)
                .lowStockThreshold(10)
                .build();
    }

    @Test
    void createReservation_shouldSucceed_andDeductStock() {
        CreateReservationRequest request = CreateReservationRequest.builder()
                .medicineId(10L)
                .pharmacyId(20L)
                .quantity(2)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(medicineRepository.findById(10L)).thenReturn(Optional.of(medicine));
        when(pharmacyRepository.findById(20L)).thenReturn(Optional.of(pharmacy));
        when(medicineStockRepository.findByPharmacyIdAndMedicineIdForUpdate(20L, 10L)).thenReturn(Optional.of(stock));
        when(reservationRepository.existsByReservationCode(anyString())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation r = invocation.getArgument(0);
            r.setId(100L);
            return r;
        });

        ReservationResponse response = reservationService.createReservation(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getQuantity()).isEqualTo(2);
        assertThat(response.getUnitPrice()).isEqualByComparingTo("25.00");
        assertThat(response.getTotalPrice()).isEqualByComparingTo("50.00");
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getReservationCode()).startsWith("MFA-");
        assertThat(response.getMedicineName()).isEqualTo("Paracetamol 500mg");
        assertThat(response.getPharmacyName()).isEqualTo("Apollo Care Pharmacy");

        // Verify stock deducted
        assertThat(stock.getQuantity()).isEqualTo(48);
        verify(medicineStockRepository).save(stock);
        verify(statusHistoryRepository).save(any(ReservationStatusHistory.class));
    }

    @Test
    void createReservation_shouldThrow_whenQuantityIsLessThanOne() {
        CreateReservationRequest request = CreateReservationRequest.builder()
                .medicineId(10L)
                .pharmacyId(20L)
                .quantity(0)
                .build();

        assertThatThrownBy(() -> reservationService.createReservation(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Quantity must be at least 1");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createReservation_shouldThrow_whenInsufficientStock() {
        stock.setQuantity(1);
        CreateReservationRequest request = CreateReservationRequest.builder()
                .medicineId(10L)
                .pharmacyId(20L)
                .quantity(5)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(medicineRepository.findById(10L)).thenReturn(Optional.of(medicine));
        when(pharmacyRepository.findById(20L)).thenReturn(Optional.of(pharmacy));
        when(medicineStockRepository.findByPharmacyIdAndMedicineIdForUpdate(20L, 10L)).thenReturn(Optional.of(stock));

        assertThatThrownBy(() -> reservationService.createReservation(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock available");

        // Ensure stock was NOT deducted
        assertThat(stock.getQuantity()).isEqualTo(1);
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void cancelReservation_shouldRestoreStock_andUpdateStatus() {
        Reservation reservation = Reservation.builder()
                .id(100L)
                .reservationCode("MFA-TEST01")
                .user(user)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(3)
                .unitPrice(new BigDecimal("25.00"))
                .totalPrice(new BigDecimal("75.00"))
                .status(Reservation.Status.PENDING)
                .build();

        when(reservationRepository.findById(100L)).thenReturn(Optional.of(reservation));
        when(medicineStockRepository.findByPharmacyIdAndMedicineIdForUpdate(20L, 10L)).thenReturn(Optional.of(stock));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        ReservationResponse response = reservationService.cancelReservation(1L, 100L, "Customer no longer needs it");

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        assertThat(response.getCancellationReason()).isEqualTo("Customer no longer needs it");

        // Verify stock restored (50 + 3 = 53)
        assertThat(stock.getQuantity()).isEqualTo(53);
        verify(medicineStockRepository).save(stock);
        verify(statusHistoryRepository).save(any(ReservationStatusHistory.class));
    }

    @Test
    void cancelReservation_shouldThrow_whenUserDoesNotOwnReservation() {
        User otherUser = User.builder().id(999L).email("other@example.com").build();
        Reservation reservation = Reservation.builder()
                .id(100L)
                .user(otherUser)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(2)
                .status(Reservation.Status.PENDING)
                .build();

        when(reservationRepository.findById(100L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservation(1L, 100L, "Sneaky cancel"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("not authorized to cancel");

        verify(medicineStockRepository, never()).save(any());
    }

    @Test
    void cancelReservation_shouldThrow_whenAlreadyCompletedOrCancelled() {
        Reservation reservation = Reservation.builder()
                .id(100L)
                .user(user)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(2)
                .status(Reservation.Status.COMPLETED)
                .build();

        when(reservationRepository.findById(100L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservation(1L, 100L, "Cancel completed"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot be cancelled in its current status");
    }

    @Test
    void getReservationById_shouldThrow_whenAnotherUserTriesToAccess() {
        User otherUser = User.builder().id(999L).email("other@example.com").build();
        Reservation reservation = Reservation.builder()
                .id(100L)
                .user(otherUser)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(2)
                .status(Reservation.Status.PENDING)
                .build();

        when(reservationRepository.findById(100L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.getReservationById(1L, 100L))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("not authorized to view");
    }

    @Test
    void cleanupExpiredReservations_shouldExpirePendingAndRestoreStock() {
        Reservation expiredReservation = Reservation.builder()
                .id(200L)
                .reservationCode("MFA-EXPIRE")
                .user(user)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(4)
                .status(Reservation.Status.PENDING)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(reservationRepository.findByStatusAndExpiresAtBefore(eq(Reservation.Status.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredReservation));
        when(medicineStockRepository.findByPharmacyIdAndMedicineIdForUpdate(20L, 10L)).thenReturn(Optional.of(stock));

        int count = reservationService.cleanupExpiredReservations();

        assertThat(count).isEqualTo(1);
        assertThat(expiredReservation.getStatus()).isEqualTo(Reservation.Status.EXPIRED);
        assertThat(stock.getQuantity()).isEqualTo(54); // 50 + 4
        verify(reservationRepository).save(expiredReservation);
        verify(medicineStockRepository).save(stock);
    }
}
