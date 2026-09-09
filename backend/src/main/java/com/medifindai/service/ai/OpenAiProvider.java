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
public class OpenAiProvider implements AiProvider {

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String DEFAULT_MODEL = "gpt-4o-mini";

    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenAiProvider(
            @Value("${app.external.openai-api-key:}") String apiKey,
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
        return "OPENAI";
    }

    @Override
    public String generateResponse(String systemPrompt,
                                   List<AiChatRequest.ChatMessageDto> history,
                                   String userMessage,
                                   String medicineContext) {
        if (!isAvailable()) {
            throw new IllegalStateException("OpenAI API key is not configured.");
        }

        try {
            List<Map<String, String>> messages = new ArrayList<>();

            // 1. System message
            StringBuilder fullSystemPrompt = new StringBuilder(systemPrompt);
            if (medicineContext != null && !medicineContext.isBlank()) {
                fullSystemPrompt.append("\n\n--- GROUNDED MEDICINE DATABASE CONTEXT ---\n")
                        .append(medicineContext)
                        .append("\n--- END CONTEXT ---\n");
            }
            messages.add(Map.of("role", "system", "content", fullSystemPrompt.toString()));

            // 2. History
            if (history != null && !history.isEmpty()) {
                int start = Math.max(0, history.size() - 8);
                for (int i = start; i < history.size(); i++) {
                    AiChatRequest.ChatMessageDto msg = history.get(i);
                    if (msg.getContent() != null && !msg.getContent().isBlank()) {
                        String role = "assistant".equalsIgnoreCase(msg.getRole()) ? "assistant" : "user";
                        messages.add(Map.of("role", role, "content", msg.getContent()));
                    }
                }
            }

            // 3. User message
            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> requestBody = Map.of(
                    "model", DEFAULT_MODEL,
                    "messages", messages,
                    "temperature", 0.3,
                    "max_tokens", 800
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(OPENAI_API_URL, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("OpenAI API returned status {}", response.getStatusCode());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String content = choices.get(0).path("message").path("content").asText("");
                return content.trim();
            }

            return null;
        } catch (Exception ex) {
            log.error("Failed to generate response via OpenAI: {}", ex.getMessage());
            return null;
        }
    }
}
