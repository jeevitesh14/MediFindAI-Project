package com.medifindai.service;

import com.medifindai.dto.pharmacyowner.*;
import com.medifindai.entity.*;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.DuplicateResourceException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.*;
import com.medifindai.service.impl.PharmacyOwnerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PharmacyOwnerServiceImplTest {

    @Mock
    private PharmacyRepository pharmacyRepository;

    @Mock
    private MedicineStockRepository medicineStockRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ReservationStatusHistoryRepository statusHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private com.medifindai.service.NotificationService notificationService;

    @InjectMocks
    private PharmacyOwnerServiceImpl pharmacyOwnerService;



    private User owner;
    private User customer;
    private Pharmacy pharmacy;
    private Medicine medicine;
    private MedicineStock medicineStock;
    private Reservation reservation;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(2L)
                .email("owner@medplus.com")
                .fullName("MedPlus Owner")
                .role(Role.PHARMACY_OWNER)
                .active(true)
                .build();

        customer = User.builder()
                .id(1L)
                .email("customer@example.com")
                .fullName("Customer User")
                .role(Role.USER)
                .active(true)
                .build();

        pharmacy = Pharmacy.builder()
                .id(10L)
                .owner(owner)
                .name("MedPlus Pharmacy")
                .licenseNumber("DL-HYD-998877")
                .addressLine("Hitech City Main Rd")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500081")
                .phone("+91 9876543210")
                .latitude(17.448)
                .longitude(78.375)
                .verificationStatus(Pharmacy.VerificationStatus.VERIFIED)
                .active(true)
                .build();

        medicine = Medicine.builder()
                .id(100L)
                .name("Amoxicillin 500mg")
                .genericName("Amoxicillin")
                .dosageForm("Capsule")
                .strength("500mg")
                .requiresPrescription(true)
                .build();

        medicineStock = MedicineStock.builder()
                .id(1000L)
                .pharmacy(pharmacy)
                .medicine(medicine)
                .quantity(20)
                .price(BigDecimal.valueOf(85.50))
                .stockStatus(MedicineStock.StockStatus.AVAILABLE)
                .lowStockThreshold(5)
                .build();

        reservation = Reservation.builder()
                .id(5000L)
                .reservationCode("MFA-HOLD01")
                .pharmacy(pharmacy)
                .medicine(medicine)
                .user(customer)
                .quantity(3)
                .unitPrice(BigDecimal.valueOf(85.50))
                .totalPrice(BigDecimal.valueOf(256.50))
                .status(Reservation.Status.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
    }

    @Test
    void getPharmacyProfile_success() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));

        PharmacyProfileResponse response = pharmacyOwnerService.getPharmacyProfile(2L);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("MedPlus Pharmacy");
        assertThat(response.getVerificationStatus()).isEqualTo("VERIFIED");
    }

    @Test
    void getPharmacyProfile_userNotFound_throwsException() {
        when(pharmacyRepository.findFirstByOwnerId(99L)).thenReturn(Optional.empty());
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pharmacyOwnerService.getPharmacyProfile(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with id: 99");
    }

    @Test
    void getPharmacyProfile_autoProvisionsPharmacy_whenOwnerHasNoPharmacy() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        when(pharmacyRepository.save(any(Pharmacy.class))).thenReturn(pharmacy);

        var response = pharmacyOwnerService.getPharmacyProfile(2L);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("MedPlus Pharmacy");
        verify(pharmacyRepository).save(any(Pharmacy.class));
    }



    @Test
    void addInventoryItem_success() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(medicineRepository.findById(100L)).thenReturn(Optional.of(medicine));
        when(medicineStockRepository.existsByPharmacyIdAndMedicineId(10L, 100L)).thenReturn(false);
        when(medicineStockRepository.save(any(MedicineStock.class))).thenAnswer(invocation -> {
            MedicineStock s = invocation.getArgument(0);
            s.setId(1001L);
            return s;
        });

        AddInventoryRequest request = AddInventoryRequest.builder()
                .medicineId(100L)
                .quantity(30)
                .price(BigDecimal.valueOf(90.00))
                .lowStockThreshold(5)
                .build();

        PharmacyInventoryItemDto result = pharmacyOwnerService.addInventoryItem(2L, request);

        assertThat(result).isNotNull();
        assertThat(result.getMedicineName()).isEqualTo("Amoxicillin 500mg");
        assertThat(result.getQuantity()).isEqualTo(30);
        assertThat(result.getStockStatus()).isEqualTo("AVAILABLE");
    }

    @Test
    void addInventoryItem_duplicate_throwsException() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(medicineRepository.findById(100L)).thenReturn(Optional.of(medicine));
        when(medicineStockRepository.existsByPharmacyIdAndMedicineId(10L, 100L)).thenReturn(true);

        AddInventoryRequest request = AddInventoryRequest.builder()
                .medicineId(100L)
                .quantity(10)
                .price(BigDecimal.valueOf(90.00))
                .build();

        assertThatThrownBy(() -> pharmacyOwnerService.addInventoryItem(2L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already in your pharmacy inventory");
    }

    @Test
    void addInventoryItem_negativeQuantity_throwsException() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));

        AddInventoryRequest request = AddInventoryRequest.builder()
                .medicineId(100L)
                .quantity(-5)
                .price(BigDecimal.valueOf(90.00))
                .build();

        assertThatThrownBy(() -> pharmacyOwnerService.addInventoryItem(2L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Quantity cannot be negative");
    }

    @Test
    void updateInventoryItem_recalculatesStatusToOutOfStock() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(medicineStockRepository.findByIdAndPharmacyId(1000L, 10L)).thenReturn(Optional.of(medicineStock));
        when(medicineStockRepository.save(any(MedicineStock.class))).thenAnswer(i -> i.getArgument(0));

        UpdateInventoryRequest request = UpdateInventoryRequest.builder()
                .quantity(0)
                .price(BigDecimal.valueOf(85.50))
                .lowStockThreshold(5)
                .build();

        PharmacyInventoryItemDto result = pharmacyOwnerService.updateInventoryItem(2L, 1000L, request);

        assertThat(result.getQuantity()).isEqualTo(0);
        assertThat(result.getStockStatus()).isEqualTo("OUT_OF_STOCK");
    }

    @Test
    void confirmReservation_success() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        when(reservationRepository.findByIdAndPharmacyId(5000L, 10L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        PharmacyReservationDto result = pharmacyOwnerService.confirmReservation(2L, 5000L);

        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
        verify(statusHistoryRepository).save(any(ReservationStatusHistory.class));
    }

    @Test
    void confirmReservation_invalidStatus_throwsException() {
        reservation.setStatus(Reservation.Status.COMPLETED);
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        when(reservationRepository.findByIdAndPharmacyId(5000L, 10L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> pharmacyOwnerService.confirmReservation(2L, 5000L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only PENDING reservations can be confirmed");
    }

    @Test
    void rejectReservation_restoresStockAndCancels() {
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        when(reservationRepository.findByIdAndPharmacyId(5000L, 10L)).thenReturn(Optional.of(reservation));
        when(medicineStockRepository.findByPharmacyIdAndMedicineIdForUpdate(10L, 100L)).thenReturn(Optional.of(medicineStock));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        int initialStock = medicineStock.getQuantity(); // 20
        int reservedQty = reservation.getQuantity(); // 3

        PharmacyReservationDto result = pharmacyOwnerService.rejectReservation(2L, 5000L, "Damaged packaging");

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
        assertThat(result.getCancellationReason()).contains("Damaged packaging");
        assertThat(medicineStock.getQuantity()).isEqualTo(initialStock + reservedQty); // 23
        verify(medicineStockRepository).save(medicineStock);
        verify(statusHistoryRepository).save(any(ReservationStatusHistory.class));
    }

    @Test
    void markReservationReady_success() {
        reservation.setStatus(Reservation.Status.CONFIRMED);
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        when(reservationRepository.findByIdAndPharmacyId(5000L, 10L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        PharmacyReservationDto result = pharmacyOwnerService.markReservationReady(2L, 5000L);

        assertThat(result.getStatus()).isEqualTo("READY_FOR_PICKUP");
        verify(statusHistoryRepository).save(any(ReservationStatusHistory.class));
    }

    @Test
    void markReservationCompleted_success() {
        reservation.setStatus(Reservation.Status.READY_FOR_PICKUP);
        when(pharmacyRepository.findFirstByOwnerId(2L)).thenReturn(Optional.of(pharmacy));
        when(userRepository.findById(2L)).thenReturn(Optional.of(owner));
        when(reservationRepository.findByIdAndPharmacyId(5000L, 10L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

        PharmacyReservationDto result = pharmacyOwnerService.markReservationCompleted(2L, 5000L);

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getPickedUpAt()).isNotNull();
        verify(statusHistoryRepository).save(any(ReservationStatusHistory.class));
    }
}
