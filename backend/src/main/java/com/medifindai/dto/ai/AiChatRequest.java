package com.medifindai.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {

    @NotBlank(message = "Message cannot be empty")
    @Size(max = 1000, message = "Message exceeds maximum length")
    private String message;

    private List<ChatMessageDto> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDto {
        private String role; // "user" or "assistant"
        private String content;
    }
}
