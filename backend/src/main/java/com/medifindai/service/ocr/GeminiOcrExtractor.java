package com.medifindai.service.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
public class GeminiOcrExtractor implements OcrTextExtractor {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/pjpeg",
            "image/png",
            "image/x-png",
            "image/webp"
    );

    private final String apiKey;
    private final String configuredModel;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiOcrExtractor(
            @Value("${app.external.gemini-api-key:}") String apiKey,
            @Value("${app.external.gemini-ocr-model:gemini-3.5-flash}") String configuredModel,
            ObjectMapper objectMapper) {

        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.configuredModel = (configuredModel == null || configuredModel.isBlank()) ? "gemini-3.5-flash" : configuredModel.trim();
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15_000);
        factory.setReadTimeout(90_000);

        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public boolean isAvailable() {
        return !apiKey.isBlank();
    }

    @Override
    public String getProviderName() {
        return "GEMINI";
    }

    @Override
    public OcrExtractionResult extractText(byte[] imageBytes, String mimeType) {
        if (!isAvailable()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "The prescription OCR service is not configured. Please check the server configuration."
            );
        }

        if (imageBytes == null || imageBytes.length == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Prescription image data is empty or invalid."
            );
        }

        String imageMimeType = mimeType == null ? "image/jpeg" : mimeType.toLowerCase().trim();
        if (!SUPPORTED_MIME_TYPES.contains(imageMimeType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported image format (" + imageMimeType + "). Please upload a JPG, PNG, or WEBP image."
            );
        }

        // Build candidate models: configured primary model first, followed by known responsive vision models
        Set<String> candidateModels = new LinkedHashSet<>();
        candidateModels.add(configuredModel);
        candidateModels.add("gemini-3.5-flash");
        candidateModels.add("gemini-3.6-flash");
        candidateModels.add("gemini-3.5-flash-lite");
        candidateModels.add("gemini-flash-latest");

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> imagePart = Map.of(
                "inline_data", Map.of(
                        "mime_type", imageMimeType,
                        "data", base64Image
                )
        );

        Map<String, Object> textPart = Map.of(
                "text",
                "You are an expert medical transcriptionist and OCR specialist.\n"
                + "Accurately transcribe all readable text from this prescription image.\n"
                + "Pay special attention to:\n"
                + "- Prescribed medicine brand names and generic active ingredient molecules\n"
                + "- Strengths and dosages (e.g., 500mg, 40mg, 10ml, 650 mg)\n"
                + "- Dosage forms (e.g., Tablet, Tab, Capsule, Cap, Syrup, Injection)\n"
                + "- Instructions and quantities (e.g., once daily, 1 tab OD after food, 5 days)\n"
                + "Preserve line breaks and the order in which items appear.\n"
                + "Do not invent or guess unreadable text. Mark illegible words as [unclear].\n"
                + "Do not provide medical advice or diagnoses. Return only the transcribed text."
        );

        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.1,
                "maxOutputTokens", 2048
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(textPart, imagePart))
                ),
                "generationConfig", generationConfig
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        List<String> failedAttempts = new ArrayList<>();
        ResponseStatusException lastAuthException = null;

        for (String model : candidateModels) {
            String endpointUrl = BASE_URL + model + ":generateContent?key=" + apiKey;
            try {
                log.info("Invoking Gemini OCR vision model: {}", model);
                ResponseEntity<String> response = restTemplate.postForEntity(endpointUrl, request, String.class);

                if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                    failedAttempts.add(model + " returned status " + response.getStatusCode());
                    continue;
                }

                JsonNode root = objectMapper.readTree(response.getBody());

                if (root.has("error")) {
                    String errorMsg = root.path("error").path("message").asText("Gemini error");
                    log.warn("Gemini model {} returned error: {}", model, errorMsg);
                    failedAttempts.add(model + ": " + errorMsg);
                    continue;
                }

                JsonNode candidateNode = root.path("candidates").path(0);
                String finishReason = candidateNode.path("finishReason").asText("");
                if ("SAFETY".equalsIgnoreCase(finishReason)) {
                    log.warn("Prescription image flagged by Gemini content safety filter");
                    return OcrExtractionResult.builder()
                            .rawText("")
                            .provider(getProviderName())
                            .success(false)
                            .fallback(false)
                            .message("The prescription image could not be processed due to content safety filters. Please upload a clear medical prescription.")
                            .build();
                }

                JsonNode parts = candidateNode.path("content").path("parts");
                StringBuilder extractedText = new StringBuilder();

                if (parts.isArray()) {
                    for (JsonNode part : parts) {
                        String text = part.path("text").asText("");
                        if (!text.isBlank()) {
                            if (!extractedText.isEmpty()) {
                                extractedText.append("\n");
                            }
                            extractedText.append(text);
                        }
                    }
                }

                String result = extractedText.toString().trim();

                if (result.isBlank()) {
                    return OcrExtractionResult.builder()
                            .rawText("")
                            .provider(getProviderName())
                            .success(true)
                            .fallback(false)
                            .message("No readable text was detected in the prescription image. Please upload a clearer image.")
                            .build();
                }

                log.info("Gemini OCR succeeded with model: {} (extracted {} chars)", model, result.length());
                return OcrExtractionResult.builder()
                        .rawText(result)
                        .provider(getProviderName() + " (" + model + ")")
                        .success(true)
                        .fallback(false)
                        .message("Text extracted successfully via Gemini AI.")
                        .build();

            } catch (RestClientResponseException ex) {
                int statusCode = ex.getStatusCode().value();
                String responseBody = ex.getResponseBodyAsString();
                log.warn("Gemini OCR model {} returned HTTP {}: {}", model, statusCode, responseBody);

                if (statusCode == 401 || statusCode == 403) {
                    lastAuthException = new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "OCR provider authentication failed. Please verify API credentials."
                    );
                    break; // No need to retry with different models if credentials are invalid
                } else if (statusCode == 429) {
                    failedAttempts.add(model + " rate limit (429)");
                } else if (statusCode == 503 || statusCode == 500 || statusCode == 502) {
                    failedAttempts.add(model + " unavailable (" + statusCode + ")");
                } else {
                    failedAttempts.add(model + " HTTP " + statusCode);
                }
            } catch (Exception ex) {
                log.warn("Gemini OCR model {} request failed: {}", model, ex.getMessage());
                failedAttempts.add(model + ": " + ex.getMessage());
            }
        }

        if (lastAuthException != null) {
            throw lastAuthException;
        }

        log.error("All Gemini OCR candidate models failed: {}", failedAttempts);
        throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "The prescription extraction service is temporarily unavailable. Please try again."
        );
    }
}
