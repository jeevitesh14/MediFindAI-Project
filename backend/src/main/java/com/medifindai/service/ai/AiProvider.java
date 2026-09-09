package com.medifindai.service.ai;

import com.medifindai.dto.ai.AiChatRequest;

import java.util.List;

public interface AiProvider {

    /**
     * Checks if this provider is configured with a valid API key and available for use.
     */
    boolean isAvailable();

    /**
     * Name/identifier of the AI provider (e.g. GEMINI, OPENAI).
     */
    String getProviderName();

    /**
     * Generates a conversational reply based on the medical system prompt, conversation history,
     * the latest user message, and grounded medicine context.
     *
     * @param systemPrompt     Healthcare assistant instructions and guardrails
     * @param history          Prior conversation turns
     * @param userMessage      Current user query
     * @param medicineContext  Grounded database information (if any)
     * @return Generated text response from the model
     */
    String generateResponse(String systemPrompt,
                            List<AiChatRequest.ChatMessageDto> history,
                            String userMessage,
                            String medicineContext);
}
