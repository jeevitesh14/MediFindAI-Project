package com.medifindai.service.ocr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrExtractionResult {

    private String rawText;
    private String provider;
    private boolean success;
    private boolean fallback;
    private String message;
}
