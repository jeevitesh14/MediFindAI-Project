package com.medifindai.service;

import com.medifindai.dto.prescription.PrescriptionScanResponse;
import com.medifindai.dto.prescription.PrescriptionSummaryDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PrescriptionOcrService {

    PrescriptionScanResponse scanAndProcess(Long userId, MultipartFile file);

    List<PrescriptionSummaryDto> getUserPrescriptions(Long userId);

    PrescriptionScanResponse getPrescriptionById(Long userId, Long prescriptionId);
}
