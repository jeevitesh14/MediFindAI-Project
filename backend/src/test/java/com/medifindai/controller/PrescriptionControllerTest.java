package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.prescription.PrescriptionScanResponse;
import com.medifindai.dto.prescription.PrescriptionSummaryDto;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.PrescriptionOcrService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionControllerTest {

    @Mock
    private PrescriptionOcrService prescriptionOcrService;

    @InjectMocks
    private PrescriptionController prescriptionController;

    private UserPrincipal testPrincipal;
    private PrescriptionScanResponse testScanResponse;
    private PrescriptionSummaryDto testSummaryDto;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .id(1L)
                .email("patient@example.com")
                .fullName("Test Patient")
                .role(Role.USER)
                .active(true)
                .passwordHash("hash")
                .build();
        testPrincipal = new UserPrincipal(user);

        testScanResponse = PrescriptionScanResponse.builder()
                .id(100L)
                .imageUrl("/uploads/prescriptions/sample.jpg")
                .rawExtractedText("Rx Paracetamol 500mg 1 tab OD")
                .detectedMedicineNames(List.of("Paracetamol 500mg"))
                .ocrProvider("FALLBACK_DEMO")
                .fallbackMode(true)
                .disclaimer("Always verify prescription details.")
                .createdAt(LocalDateTime.now())
                .build();

        testSummaryDto = PrescriptionSummaryDto.builder()
                .id(100L)
                .imageUrl("/uploads/prescriptions/sample.jpg")
                .detectedMedicineNames(List.of("Paracetamol 500mg"))
                .matchedMedicinesCount(1)
                .ocrProvider("FALLBACK_DEMO")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void scanPrescription_shouldReturnCreatedStatusAndScanResponse() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "prescription.jpg", "image/jpeg", "fake-image-bytes".getBytes()
        );

        when(prescriptionOcrService.scanAndProcess(eq(1L), any())).thenReturn(testScanResponse);

        ResponseEntity<ApiResponse<PrescriptionScanResponse>> response =
                prescriptionController.scanPrescription(testPrincipal, file);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getId()).isEqualTo(100L);
        assertThat(response.getBody().getData().getDetectedMedicineNames()).contains("Paracetamol 500mg");
    }

    @Test
    void getMyPrescriptions_shouldReturnListOfSummaries() {
        when(prescriptionOcrService.getUserPrescriptions(1L)).thenReturn(List.of(testSummaryDto));

        ApiResponse<List<PrescriptionSummaryDto>> response =
                prescriptionController.getMyPrescriptions(testPrincipal);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).hasSize(1);
        assertThat(response.getData().get(0).getId()).isEqualTo(100L);
    }

    @Test
    void getPrescriptionById_shouldReturnPrescriptionDetail() {
        when(prescriptionOcrService.getPrescriptionById(1L, 100L)).thenReturn(testScanResponse);

        ApiResponse<PrescriptionScanResponse> response =
                prescriptionController.getPrescriptionById(testPrincipal, 100L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getId()).isEqualTo(100L);
        assertThat(response.getData().getRawExtractedText()).isEqualTo("Rx Paracetamol 500mg 1 tab OD");
    }
}
