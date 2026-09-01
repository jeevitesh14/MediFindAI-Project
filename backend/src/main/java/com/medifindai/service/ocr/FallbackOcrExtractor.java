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
                .message("No external OCR provider (e.g. Google Cloud Vision) is configured on this server. Please enter the medicine names manually in the search bar below.")
                .build();
    }
}
