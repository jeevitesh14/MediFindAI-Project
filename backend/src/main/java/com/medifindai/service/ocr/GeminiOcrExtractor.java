
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
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiOcrExtractor implements OcrTextExtractor {

    private static final String API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiOcrExtractor(
            @Value("${app.external.gemini-api-key:}") String apiKey,
            ObjectMapper objectMapper) {

        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(10_000);
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
    public OcrExtractionResult extractText(
            byte[] imageBytes, String mimeType) {

        if (!isAvailable()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Gemini API key is not configured."
            );
        }

        String imageMimeType = mimeType == null
                ? "image/jpeg"
                : mimeType.toLowerCase().trim();

        if (!List.of(
                "image/jpeg",
                "image/jpg",
                "image/pjpeg",
                "image/png",
                "image/x-png",
                "image/webp"
        ).contains(imageMimeType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported image type. Upload a JPG, PNG, or WEBP image."
            );
        }

        try {
            String base64Image =
                    Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> imagePart = Map.of(
                    "inline_data", Map.of(
                            "mime_type", imageMimeType,
                            "data", base64Image
                    )
            );

            Map<String, Object> textPart = Map.of(
                    "text",
                    "Read the text visible in this prescription image. "
                    + "Transcribe medicine names and other readable text "
                    + "as accurately as possible. Do not guess unreadable "
                    + "words. Mark uncertain text as [unclear]. "
                    + "Do not recommend medicines or infer dosages. "
                    + "Return only the transcribed text."
            );

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "parts",
                                    List.of(textPart, imagePart)
                            )
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            API_URL,
                            request,
                            String.class
                    );

            if (!response.getStatusCode().is2xxSuccessful()
                    || response.getBody() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Gemini returned an empty or unsuccessful response."
                );
            }

            JsonNode root =
                    objectMapper.readTree(response.getBody());

            if (root.has("error")) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Gemini could not process the prescription."
                );
            }

            JsonNode parts = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts");

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
                        .provider("GEMINI")
                        .success(true)
                        .fallback(false)
                        .message(
                                "No readable text was found. "
                                + "Please try a clearer image."
                        )
                        .build();
            }

            return OcrExtractionResult.builder()
                    .rawText(result)
                    .provider("GEMINI")
                    .success(true)
                    .fallback(false)
                    .message(
                            "Text extracted successfully via Gemini."
                    )
                    .build();

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (RestClientResponseException ex) {
            log.error(
                    "Gemini API returned HTTP status {}. Response: {}",
                    ex.getStatusCode().value(),
                    ex.getResponseBodyAsString()
            );

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Gemini OCR request failed. Check API access and configuration."
            );

        } catch (Exception ex) {
            log.error("Gemini OCR request failed", ex);

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Gemini OCR is temporarily unavailable. Please try again."
            );
        }
    }
}
