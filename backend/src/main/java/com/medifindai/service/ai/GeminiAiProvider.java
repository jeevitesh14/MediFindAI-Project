package com.medifindai.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medifindai.dto.ai.AiChatRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Component
public class GeminiAiProvider implements AiProvider {

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiAiProvider(
            @Value("${app.external.gemini-api-key:}") String apiKey,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(20000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String getProviderName() {
        return "GEMINI";
    }

    @Override
    public String generateResponse(String systemPrompt,
                                   List<AiChatRequest.ChatMessageDto> history,
                                   String userMessage,
                                   String medicineContext) {
        if (!isAvailable()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        try {
            // 1. Build system instruction
            StringBuilder fullSystemPrompt = new StringBuilder(systemPrompt);
            if (medicineContext != null && !medicineContext.isBlank()) {
                fullSystemPrompt.append("\n\n--- GROUNDED MEDICINE DATABASE CONTEXT ---\n")
                        .append(medicineContext)
                        .append("\n--- END CONTEXT ---\n");
            }

            Map<String, Object> systemInstruction = Map.of(
                    "parts", List.of(Map.of("text", fullSystemPrompt.toString()))
            );

            // 2. Build contents array with multi-turn conversation
            List<Map<String, Object>> contents = new ArrayList<>();

            if (history != null && !history.isEmpty()) {
                // Take up to the last 8 turns to prevent token bloat
                int start = Math.max(0, history.size() - 8);
                for (int i = start; i < history.size(); i++) {
                    AiChatRequest.ChatMessageDto msg = history.get(i);
                    if (msg.getContent() != null && !msg.getContent().isBlank()) {
                        String role = "assistant".equalsIgnoreCase(msg.getRole()) ? "model" : "user";
                        contents.add(Map.of(
                                "role", role,
                                "parts", List.of(Map.of("text", msg.getContent()))
                        ));
                    }
                }
            }

            // Add the current user query
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", userMessage))
            ));

            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0.3,
                    "maxOutputTokens", 800,
                    "topP", 0.95
            );

            Map<String, Object> requestBody = Map.of(
                    "system_instruction", systemInstruction,
                    "contents", contents,
                    "generationConfig", generationConfig
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String url = GEMINI_API_URL + "?key=" + apiKey;

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Gemini API returned status {}", response.getStatusCode());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asText("");
                    return text.trim();
                }
            }

            return null;
        } catch (Exception ex) {
            log.error("Failed to generate response via Gemini AI: {}", ex.getMessage());
            return null;
        }
    }
}
