package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.pharmacyowner.*;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.PharmacyOwnerService;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyOwnerControllerTest {

    @Mock
    private PharmacyOwnerService pharmacyOwnerService;

    @InjectMocks
    private PharmacyOwnerController pharmacyOwnerController;

    private UserPrincipal ownerPrincipal;
    private PharmacyProfileResponse testProfile;
    private PharmacyInventoryItemDto testInventoryItem;
    private PharmacyReservationDto testReservation;

    @BeforeEach
    void setUp() {
        User owner = User.builder()
                .id(2L)
                .email("owner@medplus.com")
                .fullName("MedPlus Owner")
                .role(Role.PHARMACY_OWNER)
                .active(true)
                .build();
        ownerPrincipal = new UserPrincipal(owner);

        testProfile = PharmacyProfileResponse.builder()
                .id(10L)
                .ownerId(2L)
                .name("MedPlus Chemist")
                .addressLine("Madhapur Main Road")
                .city("Hyderabad")
                .state("Telangana")
                .phone("+91 9876543210")
                .verificationStatus("VERIFIED")
                .build();

        testInventoryItem = PharmacyInventoryItemDto.builder()
                .id(100L)
                .medicineId(1L)
                .medicineName("Paracetamol 500mg")
                .quantity(50)
                .price(BigDecimal.valueOf(25.0))
                .stockStatus("AVAILABLE")
                .lowStockThreshold(10)
                .build();

        testReservation = PharmacyReservationDto.builder()
                .id(500L)
                .reservationCode("MFA-TEST99")
                .medicineName("Paracetamol 500mg")
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(25.0))
                .totalPrice(BigDecimal.valueOf(50.0))
                .status("PENDING")
                .build();
    }

    @Test
    void getPharmacyProfile_shouldReturnProfile() {
        when(pharmacyOwnerService.getPharmacyProfile(2L)).thenReturn(testProfile);

        ApiResponse<PharmacyProfileResponse> response = pharmacyOwnerController.getPharmacyProfile(ownerPrincipal);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getName()).isEqualTo("MedPlus Chemist");
        assertThat(response.getData().getCity()).isEqualTo("Hyderabad");
    }

    @Test
    void updatePharmacyProfile_shouldReturnUpdatedProfile() {
        UpdatePharmacyRequest request = UpdatePharmacyRequest.builder()
                .name("MedPlus Chemist Updated")
                .addressLine("Road 36")
                .city("Hyderabad")
                .state("Telangana")
                .phone("+91 9999999999")
                .latitude(17.44)
                .longitude(78.38)
                .build();

        when(pharmacyOwnerService.updatePharmacyProfile(eq(2L), any())).thenReturn(testProfile);

        ApiResponse<PharmacyProfileResponse> response = pharmacyOwnerController.updatePharmacyProfile(ownerPrincipal, request);

        assertThat(response.isSuccess()).isTrue();
        verify(pharmacyOwnerService).updatePharmacyProfile(eq(2L), any());
    }

    @Test
    void getInventory_shouldReturnInventoryList() {
        when(pharmacyOwnerService.getInventory(2L, null, null)).thenReturn(List.of(testInventoryItem));

        ApiResponse<List<PharmacyInventoryItemDto>> response = pharmacyOwnerController.getInventory(ownerPrincipal, null, null);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).hasSize(1);
        assertThat(response.getData().get(0).getMedicineName()).isEqualTo("Paracetamol 500mg");
    }

    @Test
    void addInventoryItem_shouldReturnCreated() {
        AddInventoryRequest request = AddInventoryRequest.builder()
                .medicineId(1L)
                .quantity(50)
                .price(BigDecimal.valueOf(25.0))
                .build();

        when(pharmacyOwnerService.addInventoryItem(eq(2L), any())).thenReturn(testInventoryItem);

        ResponseEntity<ApiResponse<PharmacyInventoryItemDto>> response =
                pharmacyOwnerController.addInventoryItem(ownerPrincipal, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getQuantity()).isEqualTo(50);
    }

    @Test
    void confirmReservation_shouldReturnConfirmedReservation() {
        testReservation.setStatus("CONFIRMED");
        when(pharmacyOwnerService.confirmReservation(2L, 500L)).thenReturn(testReservation);

        ApiResponse<PharmacyReservationDto> response =
                pharmacyOwnerController.confirmReservation(ownerPrincipal, 500L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void rejectReservation_shouldReturnCancelledReservation() {
        testReservation.setStatus("CANCELLED");
        when(pharmacyOwnerService.rejectReservation(2L, 500L, "Out of stock")).thenReturn(testReservation);

        RejectReservationRequest request = new RejectReservationRequest("Out of stock");
        ApiResponse<PharmacyReservationDto> response =
                pharmacyOwnerController.rejectReservation(ownerPrincipal, 500L, request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void markReservationReady_shouldReturnReadyStatus() {
        testReservation.setStatus("READY_FOR_PICKUP");
        when(pharmacyOwnerService.markReservationReady(2L, 500L)).thenReturn(testReservation);

        ApiResponse<PharmacyReservationDto> response =
                pharmacyOwnerController.markReservationReady(ownerPrincipal, 500L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getStatus()).isEqualTo("READY_FOR_PICKUP");
    }

    @Test
    void markReservationCompleted_shouldReturnCompletedStatus() {
        testReservation.setStatus("COMPLETED");
        when(pharmacyOwnerService.markReservationCompleted(2L, 500L)).thenReturn(testReservation);

        ApiResponse<PharmacyReservationDto> response =
                pharmacyOwnerController.markReservationCompleted(ownerPrincipal, 500L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getStatus()).isEqualTo("COMPLETED");
    }
}
