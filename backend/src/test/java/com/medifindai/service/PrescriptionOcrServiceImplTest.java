package com.medifindai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medifindai.dto.medicine.MedicineSearchResponse;
import com.medifindai.dto.prescription.PrescriptionScanResponse;
import com.medifindai.entity.PrescriptionOcrRecord;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.PrescriptionOcrRecordRepository;
import com.medifindai.repository.UserRepository;
import com.medifindai.service.impl.PrescriptionOcrServiceImpl;
import com.medifindai.service.ocr.GeminiOcrExtractor;
import com.medifindai.service.ocr.MedicineMatcherService;
import com.medifindai.service.ocr.OcrExtractionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionOcrServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PrescriptionOcrRecordRepository prescriptionOcrRecordRepository;

    @Mock
    private GeminiOcrExtractor geminiOcrExtractor;

    @Mock
    private MedicineMatcherService medicineMatcherService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PrescriptionOcrServiceImpl prescriptionOcrService;

    @TempDir
    Path tempDir;

    private User testUser;
    private PrescriptionOcrRecord testRecord;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(prescriptionOcrService, "uploadDir", tempDir.toString());

        testUser = User.builder()
                .id(1L)
                .email("patient@example.com")
                .fullName("John Doe")
                .role(Role.USER)
                .active(true)
                .passwordHash("hash")
                .build();

        testRecord = PrescriptionOcrRecord.builder()
                .id(50L)
                .user(testUser)
                .imageUrl("/uploads/prescriptions/test.jpg")
                .rawExtractedText("Rx Paracetamol 500mg")
                .detectedMedicines("[\"Paracetamol 500mg\"]")
                .ocrProvider("GEMINI")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void scanAndProcess_withValidImage_shouldExtractTextAndMatchMedicines() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "prescription.png", "image/png", "test-image-data".getBytes()
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(geminiOcrExtractor.isAvailable()).thenReturn(true);
        when(geminiOcrExtractor.extractText(any(), eq("image/png"))).thenReturn(
                OcrExtractionResult.builder()
                        .rawText("Rx Paracetamol 500mg 1 tab OD")
                        .provider("GEMINI")
                        .success(true)
                        .fallback(false)
                        .message("Text extracted successfully via Gemini AI.")
                        .build()
        );

        when(medicineMatcherService.matchMedicinesFromText("Rx Paracetamol 500mg 1 tab OD")).thenReturn(
                new MedicineMatcherService.MedicineMatchResult(List.of("Paracetamol 500mg"), List.of())
        );

        when(prescriptionOcrRecordRepository.save(any(PrescriptionOcrRecord.class))).thenAnswer(invocation -> {
            PrescriptionOcrRecord r = invocation.getArgument(0);
            r.setId(50L);
            return r;
        });

        PrescriptionScanResponse response = prescriptionOcrService.scanAndProcess(1L, file);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.isFallbackMode()).isFalse();
        assertThat(response.getOcrProvider()).isEqualTo("GEMINI");
        assertThat(response.getDetectedMedicineNames()).contains("Paracetamol 500mg");
        assertThat(response.getDisclaimer()).contains("Always verify prescription details");
    }

    @Test
    void scanAndProcess_whenGeminiNotConfigured_shouldThrowServiceUnavailable() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "prescription.png", "image/png", "test-image-data".getBytes()
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(geminiOcrExtractor.isAvailable()).thenReturn(false);

        assertThatThrownBy(() -> prescriptionOcrService.scanAndProcess(1L, file))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("The prescription OCR service is not configured");
    }

    @Test
    void scanAndProcess_withNullOrEmptyFile_shouldThrowBadRequestException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> prescriptionOcrService.scanAndProcess(1L, emptyFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Please select a prescription image file");
    }

    @Test
    void scanAndProcess_withInvalidContentType_shouldThrowBadRequestException() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "script.pdf", "application/pdf", "pdf-bytes".getBytes()
        );

        assertThatThrownBy(() -> prescriptionOcrService.scanAndProcess(1L, pdfFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported file type");
    }

    @Test
    void scanAndProcess_withExecutableFile_shouldThrowBadRequestException() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file", "malicious.exe", "application/x-msdownload", "exe-bytes".getBytes()
        );

        assertThatThrownBy(() -> prescriptionOcrService.scanAndProcess(1L, exeFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported file type");
    }

    @Test
    void scanAndProcess_withOversizedFile_shouldThrowBadRequestException() {
        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6 MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file", "huge.jpg", "image/jpeg", largeBytes
        );

        assertThatThrownBy(() -> prescriptionOcrService.scanAndProcess(1L, largeFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds 5 MB limit");
    }

    @Test
    void getPrescriptionById_whenBelongsToDifferentUser_shouldThrowResourceNotFoundException() {
        when(prescriptionOcrRecordRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prescriptionOcrService.getPrescriptionById(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Prescription record not found");
    }

    @Test
    void getPrescriptionById_whenExists_shouldReturnResponse() {
        when(prescriptionOcrRecordRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(testRecord));
        when(medicineMatcherService.matchMedicinesFromText("Rx Paracetamol 500mg")).thenReturn(
                new MedicineMatcherService.MedicineMatchResult(
                        List.of("Paracetamol 500mg"),
                        List.of(MedicineSearchResponse.builder().id(1L).name("Paracetamol 500mg").build())
                )
        );

        PrescriptionScanResponse response = prescriptionOcrService.getPrescriptionById(1L, 50L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getDetectedMedicineNames()).contains("Paracetamol 500mg");
        assertThat(response.getMatchedMedicines()).hasSize(1);
    }
}
