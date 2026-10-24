package com.medifindai.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medifindai.dto.prescription.PrescriptionScanResponse;
import com.medifindai.dto.prescription.PrescriptionSummaryDto;
import com.medifindai.entity.PrescriptionOcrRecord;
import com.medifindai.entity.User;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.PrescriptionOcrRecordRepository;
import com.medifindai.repository.UserRepository;
import com.medifindai.service.PrescriptionOcrService;
import com.medifindai.service.ocr.GeminiOcrExtractor;
import com.medifindai.service.ocr.MedicineMatcherService;
import com.medifindai.service.ocr.OcrExtractionResult;
import com.medifindai.service.ocr.OcrTextExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionOcrServiceImpl implements PrescriptionOcrService {

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/pjpeg",
            "image/png",
            "image/x-png",
            "image/webp"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp"
    );
    private static final String SAFETY_DISCLAIMER =
            "Prescription images may contain sensitive health information. MediFindAI helps identify medicine names but does not provide diagnosis, dosage, or medical advice. Always verify prescription details with a pharmacist or qualified healthcare professional.";

    private final UserRepository userRepository;
    private final GeminiOcrExtractor geminiOcrExtractor;
    private final MedicineMatcherService medicineMatcherService;
    private final ObjectMapper objectMapper;
    private final PrescriptionOcrRecordRepository prescriptionOcrRecordRepository;

    @Value("${app.prescription.upload-dir:./uploads/prescriptions}")
    private String uploadDir;

    @Override
    @Transactional
    public PrescriptionScanResponse scanAndProcess(Long userId, MultipartFile file) {
        validateFile(file);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // 1. Save uploaded file securely
        String storedFilePath = saveFileLocally(file);

        // 2. Select appropriate OCR extractor
        OcrTextExtractor extractor = geminiOcrExtractor;
        // Read uploaded image
byte[] fileBytes;

try {
    fileBytes = file.getBytes();
} catch (IOException e) {
    log.error("Failed to read prescription file bytes", e);
    throw new BadRequestException(
            "Failed to read uploaded prescription file."
    );
}

// Run Gemini OCR only
OcrExtractionResult extractionResult =
        geminiOcrExtractor.extractText(
                fileBytes,
                file.getContentType()
        );

        // 3. Match medicines from extracted text
        MedicineMatcherService.MedicineMatchResult matchResult =
                medicineMatcherService.matchMedicinesFromText(extractionResult.getRawText());

        // 4. Serialize detected medicine names for DB
        String detectedMedicinesJson = "[]";
        try {
            detectedMedicinesJson = objectMapper.writeValueAsString(matchResult.detectedNames());
        } catch (Exception ex) {
            log.warn("Failed to serialize detected medicine names to JSON", ex);
        }

        // 5. Persist PrescriptionOcrRecord
        PrescriptionOcrRecord record = PrescriptionOcrRecord.builder()
                .user(user)
                .imageUrl(storedFilePath)
                .rawExtractedText(extractionResult.getRawText())
                .detectedMedicines(detectedMedicinesJson)
                .ocrProvider(extractionResult.getProvider())
                .build();

        PrescriptionOcrRecord savedRecord = prescriptionOcrRecordRepository.save(record);

        return PrescriptionScanResponse.builder()
                .id(savedRecord.getId())
                .imageUrl(savedRecord.getImageUrl())
                .rawExtractedText(savedRecord.getRawExtractedText())
                .detectedMedicineNames(matchResult.detectedNames())
                .matchedMedicines(matchResult.matchedMedicines())
                .unmatchedMedicineNames(matchResult.unmatchedNames())
                .statusMessage(matchResult.statusMessage())
                .ocrProvider(savedRecord.getOcrProvider())
                .fallbackMode(extractionResult.isFallback())
                .fallbackNotice(extractionResult.isFallback() ? extractionResult.getMessage() : null)
                .disclaimer(SAFETY_DISCLAIMER)
                .createdAt(savedRecord.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionSummaryDto> getUserPrescriptions(Long userId) {
        List<PrescriptionOcrRecord> records =
                prescriptionOcrRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return records.stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionScanResponse getPrescriptionById(Long userId, Long prescriptionId) {
        PrescriptionOcrRecord record = prescriptionOcrRecordRepository.findByIdAndUserId(prescriptionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription record not found with id: " + prescriptionId));

        List<String> detectedNames = parseDetectedMedicinesJson(record.getDetectedMedicines());
        MedicineMatcherService.MedicineMatchResult matchResult =
                medicineMatcherService.matchMedicinesFromText(record.getRawExtractedText());

        boolean isFallback = "FALLBACK_DEMO".equalsIgnoreCase(record.getOcrProvider());

        return PrescriptionScanResponse.builder()
                .id(record.getId())
                .imageUrl(record.getImageUrl())
                .rawExtractedText(record.getRawExtractedText())
                .detectedMedicineNames(detectedNames.isEmpty() ? matchResult.detectedNames() : detectedNames)
                .matchedMedicines(matchResult.matchedMedicines())
                .unmatchedMedicineNames(matchResult.unmatchedNames())
                .statusMessage(matchResult.statusMessage())
                .ocrProvider(record.getOcrProvider())
                .fallbackMode(isFallback)
                .fallbackNotice(isFallback ? "Prescription scanned in manual fallback mode." : null)
                .disclaimer(SAFETY_DISCLAIMER)
                .createdAt(record.getCreatedAt())
                .build();
    }
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a prescription image file to upload.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File size exceeds 5 MB limit. Please upload a smaller image.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Unsupported file type. Only JPG, JPEG, PNG, and WEBP images are allowed.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = StringUtils.getFilenameExtension(originalFilename);
            if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
                throw new BadRequestException("Invalid file extension. Only JPG, JPEG, PNG, and WEBP images are supported.");
            }
        }
    }

    private String saveFileLocally(MultipartFile file) {
        try {
            Path directoryPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(directoryPath)) {
                Files.createDirectories(directoryPath);
            }

            String originalFilename = file.getOriginalFilename();
            String cleanName = originalFilename != null ? StringUtils.cleanPath(originalFilename) : "prescription.jpg";
            String safeFileName = UUID.randomUUID() + "_" + cleanName.replaceAll("[^a-zA-Z0-9._-]", "_");

            Path targetPath = directoryPath.resolve(safeFileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/prescriptions/" + safeFileName;
        } catch (IOException e) {
            log.error("Could not store prescription file", e);
            return "/uploads/prescriptions/prescription_" + System.currentTimeMillis() + ".jpg";
        }
    }

    private PrescriptionSummaryDto toSummaryDto(PrescriptionOcrRecord record) {
        List<String> names = parseDetectedMedicinesJson(record.getDetectedMedicines());
        return PrescriptionSummaryDto.builder()
                .id(record.getId())
                .imageUrl(record.getImageUrl())
                .detectedMedicineNames(names)
                .matchedMedicinesCount(names.size())
                .ocrProvider(record.getOcrProvider())
                .createdAt(record.getCreatedAt())
                .build();
    }

    private List<String> parseDetectedMedicinesJson(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
