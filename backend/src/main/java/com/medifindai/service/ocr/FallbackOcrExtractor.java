package com.medifindai.service.ocr;

import org.springframework.stereotype.Component;

@Component
public class FallbackOcrExtractor implements OcrTextExtractor {

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String getProviderName() {
        return "FALLBACK_DEMO";
    }

    @Override
    public OcrExtractionResult extractText(byte[] imageBytes, String mimeType) {
        return OcrExtractionResult.builder()
                .rawText("")
                .provider(getProviderName())
                .success(true)
                .fallback(true)
                .message("Prescription extraction is not configured. Please contact the administrator or set GOOGLE_VISION_API_KEY in the environment.")
                .build();
    }
}
