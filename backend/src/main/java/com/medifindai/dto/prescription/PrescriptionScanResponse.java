package com.medifindai.dto.prescription;

import com.medifindai.dto.medicine.MedicineSearchResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionScanResponse {

    private Long id;
    private String imageUrl;
    private String rawExtractedText;
    private List<String> detectedMedicineNames;
    private List<MedicineSearchResponse> matchedMedicines;
    private List<String> unmatchedMedicineNames;
    private String statusMessage;
    private String ocrProvider;
    private boolean fallbackMode;
    private String fallbackNotice;
    private String disclaimer;
    private LocalDateTime createdAt;
}
