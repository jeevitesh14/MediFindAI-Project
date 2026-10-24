package com.medifindai.service.impl;

import com.medifindai.dto.ai.AiChatRequest;
import com.medifindai.dto.ai.AiChatResponse;
import com.medifindai.entity.*;
import com.medifindai.repository.*;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.AiAssistantService;
import com.medifindai.service.ai.GeminiAiProvider;
import com.medifindai.service.ai.MedicalIntent;
import com.medifindai.service.ai.MedicalKnowledgeBase;
import com.medifindai.service.ai.OpenAiProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantServiceImpl implements AiAssistantService {

    public static final String SAFETY_DISCLAIMER =
            "MediFindAI provides general health information and is not a substitute for professional medical advice.";

    public static final String SYSTEM_PROMPT =
            """
            You are MediFindAI Assistant, an intelligent, empathetic, and clinically aware healthcare and medicine assistant.
            Your mission is to understand the user's specific intent and provide accurate, structured, and evidence-based answers.

            CORE INSTRUCTIONS:
            1. Always determine the user's actual intent (e.g. side effects, uses, interactions, alternatives, stock, pricing, prescription rules) before answering.
            2. NEVER redirect a user asking for medical information (e.g., "side effects of paracetamol", "what is amoxicillin used for?") into a search recommendation. Directly provide the medical details requested!
            3. Use clear, bulleted markdown formatting for medical indications, common side effects, serious reactions, and precautions.
            4. When grounded context from the MediFindAI database is provided below, incorporate the real pharmacy stock, prices, dosage strengths, and prescription rules into your answer.
            5. Do NOT provide personalized clinical diagnoses or prescribe prescription medications. Encourage consulting a qualified healthcare professional when appropriate.
            """;

    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository medicineStockRepository;
    private final PharmacyRepository pharmacyRepository;
    private final AiChatLogRepository aiChatLogRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ReservationRepository reservationRepository;
    private final GeminiAiProvider geminiAiProvider;
    private final OpenAiProvider openAiProvider;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public AiChatResponse generateReply(AiChatRequest request) {
        String message = request.getMessage() != null ? request.getMessage().trim() : "";
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
                ? request.getSessionId().trim()
                : UUID.randomUUID().toString();

        if (message.isEmpty()) {
            return buildWelcomeResponse(sessionId);
        }

        // 1. Check for Explicit Navigation Directive (e.g. "open the medicine search page", "take me to nearby pharmacies")
        MedicalIntent.NavigationTarget navTarget = MedicalIntent.resolveNavigationTarget(message);
        if (navTarget != null) {
            return handleExplicitNavigation(navTarget, message, sessionId);
        }

        // 2. Multi-turn Entity Context Resolution (resolves pronouns like "it", "its", "them")
        String resolvedMedicine = resolveReferencedMedicine(message, request.getHistory());

        // 3. Classify Intent into one of 10 Standard Categories
        MedicalIntent intent = MedicalIntent.classify(message, !resolvedMedicine.isEmpty());

        // 4. Assemble Grounded Database Context (RAG)
        String groundedContext = buildGroundedContext(message, resolvedMedicine, request.getPrescriptionContext());

        // 5. Try Gemini Provider if configured and intent is medical/general inquiry
        if (geminiAiProvider.isAvailable() && shouldInvokeLlm(intent)) {
            try {
                String aiReply = geminiAiProvider.generateResponse(
                        SYSTEM_PROMPT,
                        request.getHistory(),
                        message,
                        groundedContext
                );
                if (aiReply != null && !aiReply.isBlank()) {
                    List<AiChatResponse.ChatActionDto> actions = generateStructuredActions(intent, resolvedMedicine);
                    List<String> stringChips = actions.stream().map(AiChatResponse.ChatActionDto::getLabel).toList();
                    persistChatLog(sessionId, message, aiReply);

                    return AiChatResponse.builder()
                            .reply(aiReply)
                            .intent(intent.getValue())
                            .medicineName(!resolvedMedicine.isEmpty() ? resolvedMedicine : null)
                            .actions(actions)
                            .suggestedActions(stringChips)
                            .suggestedQuestions(stringChips)
                            .disclaimer(SAFETY_DISCLAIMER)
                            .fallbackMode(false)
                            .sessionId(sessionId)
                            .provider(geminiAiProvider.getProviderName())
                            .build();
                }
            } catch (Exception e) {
                log.warn("Gemini provider failed: {}", e.getMessage());
            }
        }

        // 6. Try OpenAI Provider if configured
        if (openAiProvider.isAvailable() && shouldInvokeLlm(intent)) {
            try {
                String aiReply = openAiProvider.generateResponse(
                        SYSTEM_PROMPT,
                        request.getHistory(),
                        message,
                        groundedContext
                );
                if (aiReply != null && !aiReply.isBlank()) {
                    List<AiChatResponse.ChatActionDto> actions = generateStructuredActions(intent, resolvedMedicine);
                    List<String> stringChips = actions.stream().map(AiChatResponse.ChatActionDto::getLabel).toList();
                    persistChatLog(sessionId, message, aiReply);

                    return AiChatResponse.builder()
                            .reply(aiReply)
                            .intent(intent.getValue())
                            .medicineName(!resolvedMedicine.isEmpty() ? resolvedMedicine : null)
                            .actions(actions)
                            .suggestedActions(stringChips)
                            .suggestedQuestions(stringChips)
                            .disclaimer(SAFETY_DISCLAIMER)
                            .fallbackMode(false)
                            .sessionId(sessionId)
                            .provider(openAiProvider.getProviderName())
                            .build();
                }
            } catch (Exception e) {
                log.warn("OpenAI provider failed: {}", e.getMessage());
            }
        }

        // 7. Intelligent Clinical & Application Data Fallback Engine
        AiChatResponse fallbackResponse = generateIntelligentFallbackReply(intent, message, resolvedMedicine, sessionId);
        persistChatLog(sessionId, message, fallbackResponse.getReply());
        return fallbackResponse;
    }

    private boolean shouldInvokeLlm(MedicalIntent intent) {
        // Query database directly for personal orders, personal reservations, and explicit stock/pharmacy lookups
        return intent == MedicalIntent.MEDICAL_INFORMATION ||
                intent == MedicalIntent.GENERAL_CONVERSATION;
    }

    private AiChatResponse handleExplicitNavigation(MedicalIntent.NavigationTarget target, String userMessage, String sessionId) {
        String reply = String.format("Navigating to **%s**...", target.getDestinationName());

        AiChatResponse.NavigationActionDto navDto = AiChatResponse.NavigationActionDto.builder()
                .targetRoute(target.getRoute())
                .destinationName(target.getDestinationName())
                .requiresAuth(target.isRequiresAuth())
                .build();

        AiChatResponse.ChatActionDto actionBtn = new AiChatResponse.ChatActionDto(
                "Open " + target.getDestinationName(),
                "NAVIGATE",
                target.getRoute(),
                target.isRequiresAuth()
        );

        persistChatLog(sessionId, userMessage, reply);

        return AiChatResponse.builder()
                .reply(reply)
                .intent(MedicalIntent.APP_NAVIGATION.getValue())
                .navigation(navDto)
                .actions(List.of(actionBtn))
                .suggestedActions(List.of("Search Medicines", "Nearby Pharmacies", "How to reserve?"))
                .suggestedQuestions(List.of("Search Medicines", "Nearby Pharmacies", "How to reserve?"))
                .disclaimer(SAFETY_DISCLAIMER)
                .fallbackMode(true)
                .sessionId(sessionId)
                .provider("APP_ROUTER")
                .build();
    }

    private String resolveReferencedMedicine(String message, List<AiChatRequest.ChatMessageDto> history) {
        // Direct extract from current message
        String direct = MedicalKnowledgeBase.extractMedicineEntity(message);
        if (!direct.isEmpty()) {
            return direct;
        }

        // Check database match for keywords in current query
        String rawTerm = extractRawSearchTerm(message);
        if (!rawTerm.isEmpty()) {
            try {
                Page<Medicine> matches = medicineRepository.searchByNameOrGeneric(rawTerm, PageRequest.of(0, 1));
                if (matches != null && matches.hasContent()) {
                    return matches.getContent().get(0).getName();
                }
            } catch (Exception ignored) {
            }
        }

        // Multi-turn resolution: inspect history in reverse for pronoun resolution ("its", "it", "this medicine")
        String lower = message.toLowerCase(Locale.ROOT);
        boolean hasPronoun = lower.contains("it") || lower.contains("its") || lower.contains("them") ||
                lower.contains("this medicine") || lower.contains("this drug") || lower.contains("the medicine");

        if (hasPronoun && history != null && !history.isEmpty()) {
            for (int i = history.size() - 1; i >= 0; i--) {
                AiChatRequest.ChatMessageDto turn = history.get(i);
                if (turn.getContent() != null && !turn.getContent().isBlank()) {
                    String extracted = MedicalKnowledgeBase.extractMedicineEntity(turn.getContent());
                    if (!extracted.isEmpty()) {
                        return extracted;
                    }
                }
            }
        }

        return "";
    }

    private AiChatResponse generateIntelligentFallbackReply(MedicalIntent intent,
                                                            String userMessage,
                                                            String medicineName,
                                                            String sessionId) {
        String med = !medicineName.isEmpty() ? medicineName : "the medicine";
        Optional<MedicalKnowledgeBase.MedicineProfile> profileOpt = MedicalKnowledgeBase.findProfile(medicineName);

        StringBuilder reply = new StringBuilder();
        List<AiChatResponse.ChatActionDto> actions = generateStructuredActions(intent, medicineName);
        List<AiChatResponse.PharmacyCardDto> pharmacyCards = new ArrayList<>();
        List<AiChatResponse.MedicineSummaryDto> medicineSummaries = new ArrayList<>();
        List<AiChatResponse.UserReservationSummaryDto> reservationsList = new ArrayList<>();
        List<AiChatResponse.UserOrderSummaryDto> ordersList = new ArrayList<>();

        switch (intent) {
            case CLARIFICATION_REQUIRED -> {
                reply.append("Could you please specify what you would like to know? For example, you can ask me:\n\n")
                        .append("- **Medicine Indications & Uses** (e.g. *'What is Paracetamol used for?'*)\n")
                        .append("- **Side Effects & Warnings** (e.g. *'Side effects of Amoxicillin'*)\n")
                        .append("- **Stock & Prices** (e.g. *'Which pharmacies have Paracetamol in stock?'*)\n")
                        .append("- **Local Pharmacies** (e.g. *'Find pharmacies near Hyderabad'*)\n")
                        .append("- **Reservations & Orders** (e.g. *'How do I reserve a medicine?'* or *'What is the status of my order?'*)\n")
                        .append("- **Direct Navigation** (e.g. *'Open medicine search'* or *'Go to my orders'*)\n");
            }

            case MEDICAL_INFORMATION -> {
                String lower = userMessage.toLowerCase(Locale.ROOT);
                if (lower.contains("side effect") || lower.contains("adverse") || lower.contains("reaction")) {
                    // Side effects inquiry
                    if (profileOpt.isPresent()) {
                        var p = profileOpt.get();
                        reply.append(String.format("### Side Effects & Safety of %s (%s)\n\n", p.getName(), p.getGenericName()))
                                .append(p.getSideEffects()).append("\n\n")
                                .append("#### Important Precautions:\n")
                                .append(p.getPrecautions()).append("\n\n")
                                .append("⚠️ **When to seek immediate medical care:**\n")
                                .append("If you experience signs of a severe allergic reaction (such as facial/throat swelling, widespread hives, shortness of breath) or severe adverse symptoms, contact emergency medical services immediately.");
                    } else {
                        reply.append(String.format("### Side Effects Information for %s\n\n", med))
                                .append("Common side effects for most oral formulations include mild nausea, dizziness, or stomach irritation depending on dosage and individual tolerance. ")
                                .append("Severe reactions like swelling, difficulty breathing, or rash require immediate medical attention.\n\n")
                                .append("Please refer to the manufacturer's package insert or consult a licensed healthcare professional.");
                    }
                } else if (lower.contains("interaction") || lower.contains("take with") || lower.contains("together") || lower.contains("alcohol")) {
                    // Drug interactions
                    if (profileOpt.isPresent()) {
                        var p = profileOpt.get();
                        reply.append(String.format("### Drug Interactions for %s\n\n", p.getName()))
                                .append(p.getInteractions()).append("\n\n")
                                .append("💡 **General Rule:** Always inform your doctor or pharmacist of all vitamins, herbal supplements, and prescription medications you are currently taking.");
                    } else {
                        reply.append(String.format("### Drug Interactions Guidance for %s\n\n", med))
                                .append("Combining medications or taking them alongside alcohol can alter drug absorption or increase toxicity risk. Consult a licensed pharmacist before combining treatments.");
                    }
                } else if (lower.contains("alternative") || lower.contains("substitute")) {
                    // Alternatives
                    if (profileOpt.isPresent()) {
                        var p = profileOpt.get();
                        reply.append(String.format("### Common Alternatives to %s\n\n", p.getName()))
                                .append(p.getAlternatives()).append("\n\n")
                                .append("⚠️ **Note:** Consult your healthcare provider before substituting prescribed medications to ensure therapeutic equivalence.");
                    } else {
                        reply.append(String.format("There are several therapeutic alternatives in the same pharmacological class as %s. Please consult your physician or pharmacist for an appropriate alternative.", med));
                    }
                } else {
                    // General medicine uses / indications
                    if (profileOpt.isPresent()) {
                        var p = profileOpt.get();
                        reply.append(String.format("### About %s (%s)\n\n", p.getName(), p.getGenericName()))
                                .append("**Category:** ").append(p.getCategory()).append("\n")
                                .append("**Prescription Status:** ").append(p.isPrescriptionRequired() ? "⚠️ Prescription Required" : "✓ Over-the-Counter (OTC)").append("\n")
                                .append("**Common Formulations:** ").append(p.getStandardForms()).append("\n\n")
                                .append("#### Primary Indications & Uses:\n")
                                .append(p.getIndications()).append("\n\n")
                                .append("#### Mechanism of Action:\n")
                                .append(p.getMechanism());
                    } else {
                        reply.append(String.format("### %s Overview\n\n", med))
                                .append("This pharmaceutical product is cataloged in the MediFindAI network. You can check its verified indications, dosages, and pharmacy availability across local partner stores.");
                    }
                }
            }

            case PRICE_AVAILABILITY, MEDICINE_SEARCH -> {
                LiveStockResult stockResult = queryLiveStockAndCards(medicineName);
                reply.append(stockResult.reply);
                pharmacyCards.addAll(stockResult.cards);
                medicineSummaries.addAll(stockResult.medicineSummaries);
            }

            case PHARMACY_SEARCH -> {
                PharmacySearchResult pharmacyResult = queryNearbyPharmaciesAndCards(userMessage);
                reply.append(pharmacyResult.reply);
                pharmacyCards.addAll(pharmacyResult.cards);
            }

            case ORDER_HELP -> {
                User user = resolveAuthenticatedUser();
                if (user == null) {
                    reply.append("### Track & Manage Your Orders\n\n")
                            .append("To view your active order status, past history, and fulfillment details, please **log in to your MediFindAI account**.\n\n")
                            .append("Once logged in, you can track orders from verified partner pharmacies in real time.");
                    actions = List.of(
                            new AiChatResponse.ChatActionDto("Go to Login Page", "NAVIGATE", "/login"),
                            new AiChatResponse.ChatActionDto("Search Medicines", "NAVIGATE", "/dashboard/search")
                    );
                } else {
                    List<Order> userOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
                    if (userOrders.isEmpty()) {
                        reply.append(String.format("Hello %s, you currently do not have any active or previous orders on MediFindAI.\n\n", user.getFullName()))
                                .append("You can search for medicines in local pharmacies and place an order anytime!");
                        actions = List.of(
                                new AiChatResponse.ChatActionDto("Open Medicine Search", "NAVIGATE", "/dashboard/search"),
                                new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NAVIGATE", "/dashboard/pharmacies")
                        );
                    } else {
                        reply.append(String.format("### Your Orders (%d Total)\n\n", userOrders.size()));
                        reply.append(String.format("Here are your most recent orders, **%s**:\n\n", user.getFullName()));

                        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");
                        for (int i = 0; i < Math.min(3, userOrders.size()); i++) {
                            Order o = userOrders.get(i);
                            String dateStr = o.getCreatedAt() != null ? o.getCreatedAt().format(dtf) : "Recent";
                            String pharmacyName = o.getPharmacy() != null ? o.getPharmacy().getName() : "Partner Pharmacy";
                            BigDecimal total = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
                            int itemCount = o.getItems() != null ? o.getItems().size() : 0;

                            reply.append(String.format("- **Order #%s** — Status: `%s`\n", o.getOrderNumber(), o.getStatus()))
                                    .append(String.format("  - **Pharmacy:** %s\n", pharmacyName))
                                    .append(String.format("  - **Total:** ₹%.2f (%d %s)\n", total.doubleValue(), itemCount, itemCount == 1 ? "item" : "items"))
                                    .append(String.format("  - **Placed:** %s\n\n", dateStr));

                            ordersList.add(AiChatResponse.UserOrderSummaryDto.builder()
                                    .id(o.getId())
                                    .orderNumber(o.getOrderNumber())
                                    .pharmacyName(pharmacyName)
                                    .totalAmount(total)
                                    .status(String.valueOf(o.getStatus()))
                                    .totalItems(itemCount)
                                    .createdAt(dateStr)
                                    .build());
                        }

                        reply.append("Click **'Open Orders Page'** below to view complete invoice receipts and tracking details.");
                        actions = List.of(
                                new AiChatResponse.ChatActionDto("Open Orders Page", "NAVIGATE", "/dashboard/orders", true),
                                new AiChatResponse.ChatActionDto("Search Medicines", "NAVIGATE", "/dashboard/search")
                        );
                    }
                }
            }

            case RESERVATION_HELP -> {
                String lower = userMessage.toLowerCase(Locale.ROOT);
                boolean askingForPersonalReservations = lower.contains("my reservation") ||
                        lower.contains("my reservations") ||
                        lower.contains("show reservations") ||
                        lower.contains("show my reservations") ||
                        lower.contains("what are my reservations") ||
                        lower.contains("my pickup hold") ||
                        lower.contains("my holds");

                if (askingForPersonalReservations) {
                    User user = resolveAuthenticatedUser();
                    if (user == null) {
                        reply.append("### Active Pickup Holds & Reservations\n\n")
                                .append("To view your active 24-hour pickup holds and reservation codes, please **log in to your MediFindAI account**.");
                        actions = List.of(
                                new AiChatResponse.ChatActionDto("Go to Login Page", "NAVIGATE", "/login"),
                                new AiChatResponse.ChatActionDto("How to reserve a medicine?", "ASK_QUESTION", "How do I reserve a medicine?")
                        );
                    } else {
                        List<Reservation> userReservations = reservationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
                        if (userReservations.isEmpty()) {
                            reply.append(String.format("Hello %s, you do not have any active medicine pickup holds at this moment.\n\n", user.getFullName()))
                                    .append("You can search for any medicine and lock in a **guaranteed 24-hour hold** at any verified partner pharmacy.");
                            actions = List.of(
                                    new AiChatResponse.ChatActionDto("Open Medicine Search", "NAVIGATE", "/dashboard/search"),
                                    new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NAVIGATE", "/dashboard/pharmacies")
                            );
                        } else {
                            reply.append(String.format("### Your Pickup Holds (%d Total)\n\n", userReservations.size()));
                            reply.append(String.format("Here are your current medicine reservations, **%s**:\n\n", user.getFullName()));

                            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");
                            for (int i = 0; i < Math.min(3, userReservations.size()); i++) {
                                Reservation r = userReservations.get(i);
                                String medicineTitle = r.getMedicine() != null ? r.getMedicine().getName() : "Medicine";
                                String pharmacyTitle = r.getPharmacy() != null ? r.getPharmacy().getName() : "Partner Pharmacy";
                                String expStr = r.getExpiresAt() != null ? r.getExpiresAt().format(dtf) : "Within 24 Hours";
                                BigDecimal total = r.getTotalPrice() != null ? r.getTotalPrice() : BigDecimal.ZERO;

                                reply.append(String.format("- **Code: `%s`** — %s\n", r.getReservationCode(), medicineTitle))
                                        .append(String.format("  - **Pharmacy:** %s\n", pharmacyTitle))
                                        .append(String.format("  - **Status:** `%s` • Qty: %d • Total: ₹%.2f\n", r.getStatus(), r.getQuantity(), total.doubleValue()))
                                        .append(String.format("  - **Hold Expires:** %s\n\n", expStr));

                                reservationsList.add(AiChatResponse.UserReservationSummaryDto.builder()
                                        .id(r.getId())
                                        .reservationCode(r.getReservationCode())
                                        .medicineName(medicineTitle)
                                        .pharmacyName(pharmacyTitle)
                                        .quantity(r.getQuantity())
                                        .totalPrice(total)
                                        .status(String.valueOf(r.getStatus()))
                                        .expiresAt(expStr)
                                        .build());
                            }

                            reply.append("Present your reservation code at the pharmacy counter to collect your medicine.");
                            actions = List.of(
                                    new AiChatResponse.ChatActionDto("Open My Reservations", "NAVIGATE", "/dashboard/reservations", true),
                                    new AiChatResponse.ChatActionDto("Search Medicines", "NAVIGATE", "/dashboard/search")
                            );
                        }
                    }
                } else {
                    // General explanation of how reservations work
                    reply.append("### 24-Hour Guaranteed Medicine Pickup Holds\n\n")
                            .append("MediFindAI allows you to reserve in-stock medicines at verified partner pharmacies with a **guaranteed 24-hour hold**:\n\n")
                            .append("1. **Search** for your prescribed or OTC medicine.\n")
                            .append("2. **Select** your preferred pharmacy with verified live stock.\n")
                            .append("3. Click **'Reserve for Pickup'** to generate your secure reservation code.\n")
                            .append("4. **Visit the pharmacy counter** within 24 hours, show your code, and collect your medicine with no price surges.\n\n");

                    if (!medicineName.isEmpty()) {
                        reply.append(String.format("You can reserve **%s** immediately at verified pharmacies with available inventory.", medicineName));
                    }
                    actions = List.of(
                            new AiChatResponse.ChatActionDto("Open Medicine Search", "NAVIGATE", "/dashboard/search"),
                            new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NAVIGATE", "/dashboard/pharmacies")
                    );
                }
            }

            case PRESCRIPTION_HELP -> {
                String lower = userMessage.toLowerCase(Locale.ROOT);
                if (lower.contains("without prescription") || lower.contains("need prescription") || lower.contains("is it otc")) {
                    if (profileOpt.isPresent()) {
                        var p = profileOpt.get();
                        if (p.isPrescriptionRequired()) {
                            reply.append(String.format("⚠️ **Yes, a valid doctor's prescription is required for %s.**\n\n", p.getName()))
                                    .append(String.format("%s is a regulated %s. Partner pharmacies will verify an official doctor's prescription before dispensing.", p.getName(), p.getCategory()));
                        } else {
                            reply.append(String.format("✓ **No, %s is available Over-the-Counter (OTC).**\n\n", p.getName()))
                                    .append(String.format("You can purchase %s directly without a doctor's prescription at all partner pharmacies.", p.getName()));
                        }
                    } else {
                        reply.append(String.format("Medicines classified as antibiotics, cardiovascular agents, or schedule drugs require a valid doctor's prescription. Over-the-counter pain relievers and antacids can be purchased directly. You can check the verified prescription badge on the Medicine Search page for %s.", med));
                    }
                } else {
                    reply.append("### How to Upload & Scan Your Prescription\n\n")
                            .append("MediFindAI features an **intelligent AI Prescription Scanner (OCR)**:\n\n")
                            .append("1. Click the **'Open Prescription Upload'** button below or visit the Medicine Search page.\n")
                            .append("2. Click **'Upload Prescription & Extract Medicines'** and select an image (JPG, PNG, or PDF) of your doctor's prescription.\n")
                            .append("3. Our AI automatically extracts prescribed medicines, matches them against local inventory, and locates nearby stock!\n\n")
                            .append("You can then reserve all matching medicines in a single click.");
                }

                actions = List.of(
                        new AiChatResponse.ChatActionDto("Open Prescription Upload", "NAVIGATE", "/dashboard/search?upload=true"),
                        new AiChatResponse.ChatActionDto("Find Paracetamol", "ASK_QUESTION", "Find Paracetamol")
                );
            }

            case GENERAL_CONVERSATION -> {
                reply.append("Hello! I am your **MediFindAI Healthcare Assistant**.\n\n")
                        .append("I can help you with:\n")
                        .append("- **Medicine Uses & Indications** (e.g. *'What is Paracetamol used for?'*)\n")
                        .append("- **Side Effects & Warnings** (e.g. *'Side effects of Amoxicillin'*)\n")
                        .append("- **Live Pharmacy Stock & Pricing** (e.g. *'Which pharmacies have Paracetamol in stock?'*)\n")
                        .append("- **Local Pharmacies** (e.g. *'Find pharmacies near Hyderabad'*)\n")
                        .append("- **Pickup Holds & Orders** (e.g. *'How do I reserve a medicine?'* or *'What is the status of my order?'*)\n")
                        .append("- **Prescription OCR Scanning** (e.g. *'How can I upload a prescription?'*)\n\n")
                        .append("How may I help you today?");

                actions = List.of(
                        new AiChatResponse.ChatActionDto("Find Paracetamol", "ASK_QUESTION", "Find Paracetamol"),
                        new AiChatResponse.ChatActionDto("What is Paracetamol used for?", "ASK_QUESTION", "What is Paracetamol used for?"),
                        new AiChatResponse.ChatActionDto("Nearby Pharmacies", "ASK_QUESTION", "Which pharmacies are nearby?"),
                        new AiChatResponse.ChatActionDto("How to upload prescription?", "ASK_QUESTION", "How do I upload a prescription?")
                );
            }
        }

        List<String> stringChips = actions.stream().map(AiChatResponse.ChatActionDto::getLabel).toList();

        return AiChatResponse.builder()
                .reply(reply.toString())
                .intent(intent.getValue())
                .medicineName(!medicineName.isEmpty() ? medicineName : null)
                .actions(actions)
                .suggestedActions(stringChips)
                .suggestedQuestions(stringChips)
                .pharmacyCards(pharmacyCards.isEmpty() ? null : pharmacyCards)
                .medicineSummaries(medicineSummaries.isEmpty() ? null : medicineSummaries)
                .reservations(reservationsList.isEmpty() ? null : reservationsList)
                .orders(ordersList.isEmpty() ? null : ordersList)
                .disclaimer(SAFETY_DISCLAIMER)
                .fallbackMode(true)
                .sessionId(sessionId)
                .provider("LOCAL_FALLBACK")
                .build();
    }

    private static class LiveStockResult {
        String reply;
        List<AiChatResponse.PharmacyCardDto> cards = new ArrayList<>();
        List<AiChatResponse.MedicineSummaryDto> medicineSummaries = new ArrayList<>();
    }

    private LiveStockResult queryLiveStockAndCards(String medicineName) {
        LiveStockResult result = new LiveStockResult();
        String term = (medicineName != null && !medicineName.isBlank()) ? medicineName : "paracetamol";

        try {
            Page<Medicine> page = medicineRepository.searchByNameOrGeneric(term, PageRequest.of(0, 3));
            if (page != null && page.hasContent()) {
                Medicine first = page.getContent().get(0);
                List<MedicineStock> stocks = medicineStockRepository.findByMedicineIdWithPharmacy(first.getId());
                if (stocks == null || stocks.isEmpty()) {
                    stocks = medicineStockRepository.findByMedicineId(first.getId());
                }

                List<MedicineStock> availableStocks = stocks.stream()
                        .filter(s -> s.getPharmacy() != null && s.getPharmacy().isActive())
                        .sorted(Comparator.comparing(MedicineStock::getPrice))
                        .toList();

                List<MedicineStock> inStockOnly = availableStocks.stream()
                        .filter(s -> s.getQuantity() > 0)
                        .toList();

                BigDecimal minPrice = inStockOnly.stream()
                        .map(MedicineStock::getPrice)
                        .min(BigDecimal::compareTo)
                        .orElse(availableStocks.isEmpty() ? BigDecimal.ZERO : availableStocks.get(0).getPrice());

                result.medicineSummaries.add(AiChatResponse.MedicineSummaryDto.builder()
                        .id(first.getId())
                        .name(first.getName())
                        .genericName(first.getGenericName())
                        .dosageForm(first.getDosageForm() != null ? first.getDosageForm() : "Tablet")
                        .strength(first.getStrength())
                        .category(first.getCategory() != null ? first.getCategory().getName() : "General")
                        .prescriptionRequired(first.isRequiresPrescription())
                        .minPrice(minPrice)
                        .inStockPharmaciesCount(inStockOnly.size())
                        .build());

                StringBuilder sb = new StringBuilder();
                sb.append(String.format("### Live Stock & Pricing for %s\n\n", first.getName()));

                if (!inStockOnly.isEmpty()) {
                    sb.append(String.format("✓ **Currently in stock across %d verified partner %s** starting from **₹%.2f**.\n\n",
                            inStockOnly.size(),
                            inStockOnly.size() == 1 ? "pharmacy" : "pharmacies",
                            minPrice.doubleValue()));

                    sb.append("**Available Pharmacies:**\n");
                    for (MedicineStock s : inStockOnly) {
                        Pharmacy p = s.getPharmacy();
                        sb.append(String.format("- **%s** (%s) — ₹%.2f (%d in stock)\n",
                                p.getName(),
                                p.getCity() != null ? p.getCity() : "Nearby",
                                s.getPrice().doubleValue(),
                                s.getQuantity()));

                        String hours = p.is24Hours() ? "24/7 Open" :
                                (p.getOpeningTime() != null ? p.getOpeningTime().toString().substring(0, 5) : "08:00") +
                                        " - " + (p.getClosingTime() != null ? p.getClosingTime().toString().substring(0, 5) : "22:00");

                        result.cards.add(AiChatResponse.PharmacyCardDto.builder()
                                .id(p.getId())
                                .name(p.getName())
                                .address(p.getAddressLine())
                                .city(p.getCity())
                                .phone(p.getPhone())
                                .openingHours(hours)
                                .is24Hours(p.is24Hours())
                                .price(s.getPrice())
                                .inStockQuantity(s.getQuantity())
                                .stockStatus("IN_STOCK")
                                .build());
                    }
                    sb.append("\nYou can reserve your pickup directly or compare all locations on the Medicine Search page.");
                } else {
                    sb.append(String.format("Found **%s** in catalog, but it is currently low or out of stock across nearby partner pharmacies. You can check back shortly or explore therapeutic alternatives.", first.getName()));
                }

                result.reply = sb.toString();
                return result;
            }
        } catch (Exception e) {
            log.warn("Database lookup failed in live stock builder: {}", e.getMessage());
        }

        result.reply = String.format("You can check live inventory and pharmacy pricing for **%s** directly on the Medicine Search page.", term);
        return result;
    }

    private static class PharmacySearchResult {
        String reply;
        List<AiChatResponse.PharmacyCardDto> cards = new ArrayList<>();
    }

    private PharmacySearchResult queryNearbyPharmaciesAndCards(String userMessage) {
        PharmacySearchResult result = new PharmacySearchResult();
        String lower = userMessage.toLowerCase(Locale.ROOT);
        String targetCity = extractCityFromQuery(lower);

        try {
            List<Pharmacy> pharmacies = pharmacyRepository.findByActiveTrueAndVerificationStatus(Pharmacy.VerificationStatus.VERIFIED);
            if (pharmacies.isEmpty()) {
                pharmacies = pharmacyRepository.findAll();
            }

            if (!targetCity.isEmpty()) {
                String cityFinal = targetCity;
                List<Pharmacy> cityMatches = pharmacies.stream()
                        .filter(p -> p.getCity() != null && p.getCity().toLowerCase(Locale.ROOT).contains(cityFinal))
                        .toList();
                if (!cityMatches.isEmpty()) {
                    pharmacies = cityMatches;
                }
            }

            if (!pharmacies.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                if (!targetCity.isEmpty()) {
                    sb.append(String.format("### Verified Partner Pharmacies in %s\n\n", capitalize(targetCity)));
                } else {
                    sb.append("### Verified Partner Pharmacies Near You\n\n");
                }
                sb.append("MediFindAI connects you with verified local pharmacies featuring real-time stock sync:\n\n");

                for (int i = 0; i < Math.min(4, pharmacies.size()); i++) {
                    Pharmacy p = pharmacies.get(i);
                    String hours = p.is24Hours() ? "24/7 Open" :
                            (p.getOpeningTime() != null ? p.getOpeningTime().toString().substring(0, 5) : "08:00") +
                                    " - " + (p.getClosingTime() != null ? p.getClosingTime().toString().substring(0, 5) : "22:00");

                    sb.append(String.format("- **%s** — %s, %s (Phone: %s) • *%s*\n",
                            p.getName(),
                            p.getAddressLine() != null ? p.getAddressLine() : "Main Road",
                            p.getCity() != null ? p.getCity() : "Hyderabad",
                            p.getPhone() != null ? p.getPhone() : "N/A",
                            hours));

                    result.cards.add(AiChatResponse.PharmacyCardDto.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .address(p.getAddressLine())
                            .city(p.getCity())
                            .phone(p.getPhone())
                            .openingHours(hours)
                            .is24Hours(p.is24Hours())
                            .stockStatus("IN_STOCK")
                            .build());
                }
                sb.append("\nHead to the **Nearby Pharmacies** page to view live map distances, open hours, and directions.");
                result.reply = sb.toString();
                return result;
            }
        } catch (Exception e) {
            log.warn("Could not query pharmacies: {}", e.getMessage());
        }

        result.reply = "MediFindAI tracks verified partner pharmacies in your area. You can view addresses, map routes, and inventory on the Nearby Pharmacies page.";
        return result;
    }

    private String extractCityFromQuery(String lower) {
        String[] cities = {"hyderabad", "bangalore", "bengaluru", "mumbai", "delhi", "chennai", "kolkata", "pune", "secunderabad", "banjara hills", "jubilee hills", "kukatpally"};
        for (String c : cities) {
            if (lower.contains(c)) {
                return c;
            }
        }
        return "";
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) return "";
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }

    private List<AiChatResponse.ChatActionDto> generateStructuredActions(MedicalIntent intent, String medicineName) {
        List<AiChatResponse.ChatActionDto> actions = new ArrayList<>();
        String med = (medicineName != null && !medicineName.isBlank()) ? medicineName : "Paracetamol";

        switch (intent) {
            case MEDICAL_INFORMATION -> {
                actions.add(new AiChatResponse.ChatActionDto("Check Stock in Pharmacies", "ASK_QUESTION", "Which pharmacies have " + med + " in stock?"));
                actions.add(new AiChatResponse.ChatActionDto("Compare Prices", "ASK_QUESTION", "Compare " + med + " prices"));
                actions.add(new AiChatResponse.ChatActionDto("Do I need a prescription?", "ASK_QUESTION", "Do I need a prescription for " + med + "?"));
                actions.add(new AiChatResponse.ChatActionDto("Open Medicine Search", "NAVIGATE", "/dashboard/search?q=" + med));
            }
            case PRICE_AVAILABILITY, MEDICINE_SEARCH -> {
                actions.add(new AiChatResponse.ChatActionDto("Side effects of " + med, "ASK_QUESTION", "What are the side effects of " + med + "?"));
                actions.add(new AiChatResponse.ChatActionDto("Nearby Pharmacies", "ASK_QUESTION", "Which pharmacies are nearby?"));
                actions.add(new AiChatResponse.ChatActionDto("Open Medicine Search", "NAVIGATE", "/dashboard/search?q=" + med));
            }
            case PHARMACY_SEARCH -> {
                actions.add(new AiChatResponse.ChatActionDto("Find Paracetamol", "ASK_QUESTION", "Find Paracetamol"));
                actions.add(new AiChatResponse.ChatActionDto("Open Nearby Pharmacies", "NAVIGATE", "/dashboard/pharmacies"));
            }
            case PRESCRIPTION_HELP -> {
                actions.add(new AiChatResponse.ChatActionDto("Open Prescription Upload", "NAVIGATE", "/dashboard/search?upload=true"));
                actions.add(new AiChatResponse.ChatActionDto("Find Paracetamol", "ASK_QUESTION", "Find Paracetamol"));
            }
            case ORDER_HELP -> {
                actions.add(new AiChatResponse.ChatActionDto("Open Orders Page", "NAVIGATE", "/dashboard/orders", true));
                actions.add(new AiChatResponse.ChatActionDto("Open Medicine Search", "NAVIGATE", "/dashboard/search"));
            }
            case RESERVATION_HELP -> {
                actions.add(new AiChatResponse.ChatActionDto("Open My Reservations", "NAVIGATE", "/dashboard/reservations", true));
                actions.add(new AiChatResponse.ChatActionDto("Open Medicine Search", "NAVIGATE", "/dashboard/search"));
            }
            default -> {
                actions.add(new AiChatResponse.ChatActionDto("Find Paracetamol", "ASK_QUESTION", "Find Paracetamol"));
                actions.add(new AiChatResponse.ChatActionDto("What is Paracetamol used for?", "ASK_QUESTION", "What is Paracetamol used for?"));
                actions.add(new AiChatResponse.ChatActionDto("Nearby Pharmacies", "ASK_QUESTION", "Which pharmacies are nearby?"));
                actions.add(new AiChatResponse.ChatActionDto("How to upload prescription?", "ASK_QUESTION", "How do I upload a prescription?"));
            }
        }
        return actions;
    }

    private String extractRawSearchTerm(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        String[] prefixes = {"find ", "search ", "look for ", "what is ", "side effects of ", "price of ", "where is "};
        for (String p : prefixes) {
            if (lower.startsWith(p)) {
                String candidate = lower.substring(p.length()).trim().replaceAll("[?.!,;:]+$", "").trim();
                if (!candidate.isEmpty() && candidate.length() < 40) {
                    return candidate;
                }
            }
        }
        return "";
    }

    private String buildGroundedContext(String message, String resolvedMedicine, String prescriptionContext) {
        StringBuilder sb = new StringBuilder();
        if (resolvedMedicine != null && !resolvedMedicine.isBlank()) {
            sb.append("MEDICINE IDENTIFIED: ").append(resolvedMedicine).append("\n");
            Optional<MedicalKnowledgeBase.MedicineProfile> profile = MedicalKnowledgeBase.findProfile(resolvedMedicine);
            if (profile.isPresent()) {
                var p = profile.get();
                sb.append(String.format("Generic Name: %s\nCategory: %s\nPrescription Required: %s\nIndications: %s\nSide Effects: %s\n",
                        p.getGenericName(), p.getCategory(), p.isPrescriptionRequired(), p.getIndications(), p.getSideEffects()));
            }
        }
        if (prescriptionContext != null && !prescriptionContext.isBlank()) {
            sb.append("PRESCRIPTION SCAN CONTEXT: ").append(prescriptionContext).append("\n");
        }
        return sb.toString();
    }

    private AiChatResponse buildWelcomeResponse(String sessionId) {
        List<AiChatResponse.ChatActionDto> starterActions = List.of(
                new AiChatResponse.ChatActionDto("Find Paracetamol", "ASK_QUESTION", "Find Paracetamol"),
                new AiChatResponse.ChatActionDto("What is Paracetamol used for?", "ASK_QUESTION", "What is Paracetamol used for?"),
                new AiChatResponse.ChatActionDto("Side effects of Paracetamol", "ASK_QUESTION", "What are the side effects of Paracetamol?"),
                new AiChatResponse.ChatActionDto("Nearby Pharmacies", "ASK_QUESTION", "Which pharmacies are nearby?"),
                new AiChatResponse.ChatActionDto("How to upload prescription?", "ASK_QUESTION", "How do I upload a prescription?")
        );

        List<String> starterPrompts = starterActions.stream().map(AiChatResponse.ChatActionDto::getLabel).toList();

        return AiChatResponse.builder()
                .reply("Hello! I am your **MediFindAI Assistant**. How can I help you find medicines, check live pharmacy stock, or explain indications and side effects today?")
                .intent(MedicalIntent.GENERAL_CONVERSATION.getValue())
                .disclaimer(SAFETY_DISCLAIMER)
                .actions(starterActions)
                .suggestedActions(starterPrompts)
                .suggestedQuestions(starterPrompts)
                .fallbackMode(true)
                .sessionId(sessionId)
                .provider("LOCAL_FALLBACK")
                .build();
    }

    private void persistChatLog(String sessionId, String userMessage, String aiReply) {
        try {
            User currentUser = resolveAuthenticatedUser();

            AiChatLog userLog = AiChatLog.builder()
                    .user(currentUser)
                    .sessionId(sessionId)
                    .role(AiChatLog.Role.USER)
                    .message(userMessage)
                    .build();
            aiChatLogRepository.save(userLog);

            AiChatLog botLog = AiChatLog.builder()
                    .user(currentUser)
                    .sessionId(sessionId)
                    .role(AiChatLog.Role.ASSISTANT)
                    .message(aiReply)
                    .build();
            aiChatLogRepository.save(botLog);
        } catch (Exception ex) {
            log.warn("Unable to persist chat log: {}", ex.getMessage());
        }
    }

    private User resolveAuthenticatedUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                return userRepository.findById(principal.getId()).orElse(null);
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
