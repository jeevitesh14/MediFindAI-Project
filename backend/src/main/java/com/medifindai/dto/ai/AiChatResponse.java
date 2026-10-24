package com.medifindai.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;
    private String disclaimer;
    private List<String> suggestedActions;
    private List<String> suggestedQuestions;
    private boolean fallbackMode;
    private String sessionId;
    private String provider;
    private String intent; // One of the 10 standard intent categories
    private String medicineName;
    private List<ChatActionDto> actions;

    // Structured rich data models
    private NavigationActionDto navigation;
    private List<PharmacyCardDto> pharmacyCards;
    private List<MedicineSummaryDto> medicineSummaries;
    private List<UserReservationSummaryDto> reservations;
    private List<UserOrderSummaryDto> orders;
    private Map<String, Object> data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatActionDto {
        private String label;
        private String action; // "ASK_QUESTION" (submit question in chat) or "NAVIGATE" (explicit navigation)
        private String payload; // text question or navigation route URL
        private boolean requiresAuth;

        public ChatActionDto(String label, String action, String payload) {
            this.label = label;
            this.action = action;
            this.payload = payload;
            this.requiresAuth = false;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NavigationActionDto {
        private String targetRoute; // e.g. "/dashboard/search", "/dashboard/reservations"
        private String destinationName; // e.g. "Medicine Search", "My Reservations"
        private boolean requiresAuth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PharmacyCardDto {
        private Long id;
        private String name;
        private String address;
        private String city;
        private String phone;
        private String openingHours;
        private boolean is24Hours;
        private BigDecimal price;
        private Integer inStockQuantity;
        private String stockStatus; // "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicineSummaryDto {
        private Long id;
        private String name;
        private String genericName;
        private String dosageForm;
        private String strength;
        private String category;
        private boolean prescriptionRequired;
        private BigDecimal minPrice;
        private Integer inStockPharmaciesCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserReservationSummaryDto {
        private Long id;
        private String reservationCode;
        private String medicineName;
        private String pharmacyName;
        private int quantity;
        private BigDecimal totalPrice;
        private String status;
        private String expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserOrderSummaryDto {
        private Long id;
        private String orderNumber;
        private String pharmacyName;
        private BigDecimal totalAmount;
        private String status;
        private int totalItems;
        private String createdAt;
    }
}
