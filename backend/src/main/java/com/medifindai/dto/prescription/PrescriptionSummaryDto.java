package com.medifindai.dto.prescription;

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
public class PrescriptionSummaryDto {

    private Long id;
    private String imageUrl;
    private List<String> detectedMedicineNames;
    private int matchedMedicinesCount;
    private String ocrProvider;
    private LocalDateTime createdAt;
}
