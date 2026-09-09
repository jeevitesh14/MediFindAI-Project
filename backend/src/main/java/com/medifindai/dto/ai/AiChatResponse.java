package com.medifindai.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;
    private String disclaimer;
    private List<String> suggestedActions;
    private boolean fallbackMode;
    private String sessionId;
    private String provider;
    private String intent;
    private String medicineName;
    private List<ChatActionDto> actions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatActionDto {
        private String label;
        private String action; // e.g. MEDICINE_SEARCH, NEARBY_PHARMACIES, PRESCRIPTION_UPLOAD, ORDERS, RESERVATIONS, ASK_QUESTION
        private String payload; // e.g. "Paracetamol", "/dashboard/orders", etc.
    }
}
