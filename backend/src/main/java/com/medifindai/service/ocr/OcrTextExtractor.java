package com.medifindai.service.ocr;

public interface OcrTextExtractor {

    boolean isAvailable();

    String getProviderName();

    OcrExtractionResult extractText(byte[] imageBytes, String mimeType);
}
