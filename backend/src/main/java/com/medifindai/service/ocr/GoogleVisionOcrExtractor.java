package com.medifindai.service.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Component
public class GoogleVisionOcrExtractor implements OcrTextExtractor {

    private static final String GOOGLE_VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GoogleVisionOcrExtractor(
            @Value("${app.external.google-vision-api-key:}") String apiKey,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String getProviderName() {
        return "GOOGLE_VISION";
    }

    @Override
    public OcrExtractionResult extractText(byte[] imageBytes, String mimeType) {
        if (!isAvailable()) {
            return OcrExtractionResult.builder()
                    .rawText("")
                    .provider(getProviderName())
                    .success(false)
                    .fallback(true)
                    .message("Google Vision API key is not configured.")
                    .build();
        }

        try {
            String base64Content = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> imageMap = Map.of("content", base64Content);
            Map<String, Object> featureMap = Map.of("type", "DOCUMENT_TEXT_DETECTION");
            Map<String, Object> requestItem = Map.of(
                    "image", imageMap,
                    "features", List.of(featureMap)
            );
            Map<String, Object> requestBody = Map.of("requests", List.of(requestItem));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String url = GOOGLE_VISION_API_URL + "?key=" + apiKey;

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Google Vision API returned non-2xx status: {}", response.getStatusCode());
                return OcrExtractionResult.builder()
                        .rawText("")
                        .provider(getProviderName())
                        .success(false)
                        .fallback(true)
                        .message("Google Vision OCR failed to process the image.")
                        .build();
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode responsesNode = root.path("responses");
            if (responsesNode.isArray() && !responsesNode.isEmpty()) {
                JsonNode firstResponse = responsesNode.get(0);
                JsonNode fullTextNode = firstResponse.path("fullTextAnnotation").path("text");
                String extractedText = fullTextNode.asText("");

                if (extractedText.isBlank()) {
                    JsonNode textAnnotations = firstResponse.path("textAnnotations");
                    if (textAnnotations.isArray() && !textAnnotations.isEmpty()) {
                        extractedText = textAnnotations.get(0).path("description").asText("");
                    }
                }

                return OcrExtractionResult.builder()
                        .rawText(extractedText.trim())
                        .provider(getProviderName())
                        .success(true)
                        .fallback(false)
                        .message("Text extracted successfully via Google Vision OCR.")
                        .build();
            }

            return OcrExtractionResult.builder()
                    .rawText("")
                    .provider(getProviderName())
                    .success(true)
                    .fallback(false)
                    .message("No text detected in the provided prescription image.")
                    .build();

        } catch (Exception ex) {
            log.error("Error executing Google Vision OCR", ex);
            return OcrExtractionResult.builder()
                    .rawText("")
                    .provider(getProviderName())
                    .success(false)
                    .fallback(true)
                    .message("Error communicating with Google Vision API: " + ex.getMessage())
                    .build();
        }
    }
}
