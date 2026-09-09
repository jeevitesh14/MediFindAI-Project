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

        // 1. Multi-turn Entity Context Resolution (resolves pronouns like "it", "its", "them")
        String resolvedMedicine = resolveReferencedMedicine(message, request.getHistory());

        // 2. Classify Intent
        MedicalIntent intent = MedicalIntent.classify(message, !resolvedMedicine.isEmpty());

        // 3. Assemble Grounded Database Context (RAG)
        String groundedContext = buildGroundedContext(message, resolvedMedicine, request.getPrescriptionContext());

        // 4. Try Gemini Provider if configured
        if (geminiAiProvider.isAvailable()) {
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

        // 5. Try OpenAI Provider if configured
        if (openAiProvider.isAvailable()) {
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

        // 6. Intelligent Clinical Fallback Engine (Resilient local medical knowledge & DB queries)
        AiChatResponse fallbackResponse = generateIntelligentFallbackReply(intent, message, resolvedMedicine, sessionId);
        persistChatLog(sessionId, message, fallbackResponse.getReply());
        return fallbackResponse;
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
                Page<Medicine> page = medicineRepository.searchByNameOrGeneric(rawTerm, PageRequest.of(0, 1));
                if (page != null && page.hasContent()) {
                    return page.getContent().get(0).getName();
                }
            } catch (Exception ignored) {
            }
        }

        // If message contains anaphoric pronouns ("it", "its", "them", "this", "that"), scan history in reverse
        String lower = message.toLowerCase(Locale.ROOT);
        boolean hasPronoun = lower.contains(" it ") || lower.contains(" its ") || lower.endsWith(" it") ||
                lower.contains(" it?") || lower.contains(" this ") || lower.contains(" this?") ||
                lower.contains(" them ") || lower.contains(" that ") || lower.contains("the medicine");

        if (history != null && !history.isEmpty()) {
            for (int i = history.size() - 1; i >= 0; i--) {
                AiChatRequest.ChatMessageDto turn = history.get(i);
                if (turn.getContent() != null) {
                    String fromHistory = MedicalKnowledgeBase.extractMedicineEntity(turn.getContent());
                    if (!fromHistory.isEmpty()) {
                        return fromHistory;
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

        switch (intent) {
            case GREETING -> {
                reply.append("Hello! I am your **MediFindAI Medical Assistant**.\n\n")
                        .append("I can help you with:\n")
                        .append("- **Medicine Information & Uses** (e.g. *'What is Paracetamol used for?'*)\n")
                        .append("- **Side Effects & Precautions** (e.g. *'Side effects of Amoxicillin'*)\n")
                        .append("- **Live Pharmacy Stock & Locations** (e.g. *'Which pharmacy has Paracetamol?'*)\n")
                        .append("- **Price Comparisons** (e.g. *'Compare Paracetamol prices'*)\n")
                        .append("- **Prescription Upload & Orders** (e.g. *'Where can I upload my prescription?'*)\n\n")
                        .append("How can I assist your health journey today?");
            }

            case MEDICINE_SIDE_EFFECTS -> {
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
                            .append("Most medications can cause mild side effects such as nausea, dizziness, or stomach upset depending on individual tolerance. ")
                            .append("Severe side effects like allergic reactions, breathing difficulties, or organ stress require immediate medical intervention.\n\n")
                            .append("Please refer to the manufacturer's package leaflet or consult a licensed pharmacist for comprehensive guidance.");
                }
            }

            case MEDICINE_USES, MEDICINE_INFORMATION -> {
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
                            .append("This pharmaceutical formulation is cataloged in MediFindAI. You can check its verified indications, dosages, and pharmacy availability across local partner stores.");
                }
            }

            case DRUG_INTERACTIONS -> {
                if (profileOpt.isPresent()) {
                    var p = profileOpt.get();
                    reply.append(String.format("### Drug Interactions for %s\n\n", p.getName()))
                            .append(p.getInteractions()).append("\n\n")
                            .append("💡 **General Rule:** Always inform your doctor or pharmacist of all vitamins, herbal supplements, and prescription medications you are taking.");
                } else {
                    reply.append(String.format("### Drug Interactions Guidance for %s\n\n", med))
                            .append("Combining multiple medications or taking medications with alcohol can alter drug absorption or increase toxicity risk. Consult a doctor or licensed pharmacist before combining treatments.");
                }
            }

            case MEDICINE_ALTERNATIVES -> {
                if (profileOpt.isPresent()) {
                    var p = profileOpt.get();
                    reply.append(String.format("### Common Alternatives to %s\n\n", p.getName()))
                            .append(p.getAlternatives()).append("\n\n")
                            .append("⚠️ **Note:** Consult your healthcare provider before substituting prescribed medications to ensure therapeutic equivalence.");
                } else {
                    reply.append(String.format("There are several therapeutic alternatives in the same class as %s. Please consult your physician or pharmacist to choose the appropriate alternative.", med));
                }
            }

            case PHARMACY_STOCK -> {
                reply.append(buildLiveStockAnswer(medicineName));
            }

            case NEARBY_PHARMACIES -> {
                reply.append(buildNearbyPharmaciesAnswer(medicineName));
            }

            case PRICE_COMPARISON -> {
                reply.append(buildPriceComparisonAnswer(medicineName));
            }

            case PRESCRIPTION_REQUIREMENT -> {
                if (profileOpt.isPresent()) {
                    var p = profileOpt.get();
                    if (p.isPrescriptionRequired()) {
                        reply.append(String.format("**Yes, a valid doctor's prescription is required for %s.**\n\n", p.getName()))
                                .append(String.format("%s is a regulated %s. Partner pharmacies require an official prescription upon pickup or delivery.", p.getName(), p.getCategory()));
                    } else {
                        reply.append(String.format("**No, %s is available Over-the-Counter (OTC).**\n\n", p.getName()))
                                .append(String.format("You can purchase %s directly without a doctor's prescription at partner pharmacies.", p.getName()));
                    }
                } else {
                    reply.append(String.format("Medicines classified as antibiotics, cardiovascular agents, or controlled substances require a valid prescription. OTC pain relievers and antacids can be purchased directly. You can verify the prescription badge on the Medicine Search page for %s.", med));
                }
            }

            case PRESCRIPTION_HELP -> {
                reply.append("### Upload & Scan Your Prescription\n\n")
                        .append("MediFindAI features an **AI-powered Prescription OCR scanner**:\n")
                        .append("1. Navigate to **Prescriptions** or click **'Upload Prescription'** below.\n")
                        .append("2. Upload an image (JPG, PNG, PDF) of your doctor's prescription.\n")
                        .append("3. Our system automatically extracts prescribed medicine names, matches catalog inventory, and locates nearby stock!");
            }

            case SYMPTOMS_HEALTH -> {
                reply.append("### General Symptom & Self-Care Guidance\n\n");
                String lower = userMessage.toLowerCase(Locale.ROOT);
                if (lower.contains("headache")) {
                    reply.append("For common tension or mild headaches:\n")
                            .append("- **First-Line OTC Options:** Paracetamol (500mg) or Ibuprofen (400mg, with food).\n")
                            .append("- **Supportive Care:** Stay hydrated, rest in a quiet dark room, and avoid excessive screen glare.\n\n")
                            .append("⚠️ **Emergency Warning:** Seek urgent emergency care if the headache is sudden and explosive ('thunderclap'), accompanied by fever, neck stiffness, confusion, or visual loss.");
                } else if (lower.contains("fever") || lower.contains("cold")) {
                    reply.append("For mild fever and cold symptoms:\n")
                            .append("- **Fever/Pain Relief:** Paracetamol or Ibuprofen helps reduce body temperature and aches.\n")
                            .append("- **Decongestants/Allergies:** Antihistamines like Cetirizine can relieve runny nose and sneezing.\n")
                            .append("- **Hydration:** Drink plenty of fluids (warm water, broths) and ensure adequate rest.");
                } else {
                    reply.append("For mild symptoms, over-the-counter options like Paracetamol (pain/fever), Cetirizine (allergies), or Pantoprazole (acidity/heartburn) may provide temporary relief.\n\n")
                            .append("If symptoms persist for more than 48 hours or worsen, please consult a qualified physician.");
                }
            }

            case ORDER_HELP -> {
                reply.append("### Manage & Track Orders\n\n")
                        .append("You can track active medicine orders, view detailed fulfillment status, and see past order history in the **Orders** section.");
            }

            case RESERVATION_HELP -> {
                reply.append("### 24-Hour Medicine Pickup Holds\n\n")
                        .append("MediFindAI allows you to reserve in-stock medicines at verified partner pharmacies with a **guaranteed 24-hour hold**:\n")
                        .append("1. Find your medicine on the Search page.\n")
                        .append("2. Select your preferred pharmacy and click **'Reserve for Pickup'**.\n")
                        .append("3. Present your reservation code at the pharmacy counter to collect.\n\n");
                if (!medicineName.isEmpty()) {
                    reply.append(String.format("You can reserve **%s** immediately at our partner pharmacies with active stock.", medicineName));
                }
            }

            case MEDICINE_SEARCH -> {
                reply.append(buildLiveStockAnswer(medicineName));
            }

            case UNKNOWN, GENERAL_CONVERSATION -> {
                reply.append("I am your **MediFindAI Healthcare Assistant**. I can provide structured medical information on medicines, indications, side effects, precautions, and live pharmacy inventory.\n\n")
                        .append("You can ask questions like:\n")
                        .append("- *'What is Paracetamol used for?'*\n")
                        .append("- *'Side effects of Amoxicillin'*\n")
                        .append("- *'Which pharmacy has Paracetamol in stock?'*\n")
                        .append("- *'Can I take Ibuprofen with Paracetamol?'*");
            }
        }

        List<String> stringChips = actions.stream().map(AiChatResponse.ChatActionDto::getLabel).toList();

        return AiChatResponse.builder()
                .reply(reply.toString())
                .intent(intent.getValue())
                .medicineName(!medicineName.isEmpty() ? medicineName : null)
                .actions(actions)
                .suggestedActions(stringChips)
                .disclaimer(SAFETY_DISCLAIMER)
                .fallbackMode(true)
                .sessionId(sessionId)
                .provider("LOCAL_FALLBACK")
                .build();
    }

    private String buildLiveStockAnswer(String medicineName) {
        String term = !medicineName.isEmpty() ? medicineName : "paracetamol";
        try {
            Page<Medicine> page = medicineRepository.searchByNameOrGeneric(term, PageRequest.of(0, 3));
            if (page != null && page.hasContent()) {
                Medicine first = page.getContent().get(0);
                List<MedicineStock> stocks = medicineStockRepository.findByMedicineIdWithPharmacy(first.getId());
                if (stocks == null || stocks.isEmpty()) {
                    stocks = medicineStockRepository.findByMedicineId(first.getId());
                }

                List<MedicineStock> availableStocks = stocks.stream()
                        .filter(s -> s.getPharmacy() != null && s.getPharmacy().isActive() && s.getQuantity() > 0)
                        .toList();

                if (!availableStocks.isEmpty()) {
                    BigDecimal minPrice = availableStocks.stream()
                            .map(MedicineStock::getPrice)
                            .min(BigDecimal::compareTo)
                            .orElse(BigDecimal.ZERO);

                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("### Live Stock for %s (%s %s)\n\n",
                            first.getName(),
                            first.getDosageForm() != null ? first.getDosageForm() : "Tablet",
                            first.getStrength() != null ? first.getStrength() : ""));

                    sb.append(String.format("✓ **Currently in stock at %d verified partner %s** starting from **₹%.2f**.\n\n",
                            availableStocks.size(),
                            availableStocks.size() == 1 ? "pharmacy" : "pharmacies",
                            minPrice.doubleValue()));

                    sb.append("**Available Pharmacies:**\n");
                    for (int i = 0; i < Math.min(4, availableStocks.size()); i++) {
                        MedicineStock s = availableStocks.get(i);
                        sb.append(String.format("- **%s** (%s) — ₹%.2f (Qty: %d in stock)\n",
                                s.getPharmacy().getName(),
                                s.getPharmacy().getCity() != null ? s.getPharmacy().getCity() : "Nearby",
                                s.getPrice().doubleValue(),
                                s.getQuantity()));
                    }

                    sb.append("\nYou can reserve your pickup directly or compare all locations on the Medicine Search page.");
                    return sb.toString();
                } else {
                    return String.format("Found **%s** in catalog, but it is currently low or out of stock across nearby partner pharmacies. You can check back shortly or explore therapeutic alternatives.", first.getName());
                }
            }
        } catch (Exception e) {
            log.warn("Database lookup failed in live stock builder: {}", e.getMessage());
        }

        return String.format("You can check live inventory and pharmacy pricing for **%s** directly on the Medicine Search page.", term);
    }

    private String buildNearbyPharmaciesAnswer(String medicineName) {
        try {
            List<Pharmacy> pharmacies = pharmacyRepository.findByActiveTrueAndVerificationStatus(Pharmacy.VerificationStatus.VERIFIED);
            if (pharmacies.isEmpty()) {
                pharmacies = pharmacyRepository.findAll();
            }

            if (!pharmacies.isEmpty()) {
                StringBuilder sb = new StringBuilder("### Verified Partner Pharmacies Near You\n\n");
                sb.append("MediFindAI connects you with verified local pharmacies featuring real-time stock sync:\n\n");
                for (int i = 0; i < Math.min(4, pharmacies.size()); i++) {
                    Pharmacy p = pharmacies.get(i);
                    sb.append(String.format("- **%s** — %s, %s (Phone: %s)\n",
                            p.getName(),
                            p.getAddressLine() != null ? p.getAddressLine() : "Main Branch",
                            p.getCity() != null ? p.getCity() : "City",
                            p.getPhone() != null ? p.getPhone() : "N/A"));
                }
                sb.append("\nHead to the **Nearby Pharmacies** page to view live map distances, open hours, and directions.");
                return sb.toString();
            }
        } catch (Exception e) {
            log.warn("Could not query pharmacies: {}", e.getMessage());
        }

        return "MediFindAI tracks verified partner pharmacies in your area. You can view addresses, map routes, and inventory on the Nearby Pharmacies page.";
    }

    private String buildPriceComparisonAnswer(String medicineName) {
        String term = !medicineName.isEmpty() ? medicineName : "paracetamol";
        try {
            Page<Medicine> page = medicineRepository.searchByNameOrGeneric(term, PageRequest.of(0, 1));
            if (page != null && page.hasContent()) {
                Medicine m = page.getContent().get(0);
                List<MedicineStock> stocks = medicineStockRepository.findByMedicineIdWithPharmacy(m.getId());
                if (stocks == null || stocks.isEmpty()) {
                    stocks = medicineStockRepository.findByMedicineId(m.getId());
                }

                if (!stocks.isEmpty()) {
                    List<MedicineStock> sorted = stocks.stream()
                            .filter(s -> s.getPharmacy() != null && s.getPharmacy().isActive())
                            .sorted(Comparator.comparing(MedicineStock::getPrice))
                            .toList();

                    if (!sorted.isEmpty()) {
                        StringBuilder sb = new StringBuilder();
                        sb.append(String.format("### Price Comparison for %s\n\n", m.getName()));
                        sb.append(String.format("Best price starts at **₹%.2f** at **%s**.\n\n",
                                sorted.get(0).getPrice().doubleValue(),
                                sorted.get(0).getPharmacy().getName()));

                        sb.append("**Price Breakdown Across Partner Pharmacies:**\n");
                        for (MedicineStock s : sorted) {
                            sb.append(String.format("- **%s**: ₹%.2f (%s)\n",
                                    s.getPharmacy().getName(),
                                    s.getPrice().doubleValue(),
                                    s.getQuantity() > 0 ? "In Stock: " + s.getQuantity() : "Out of stock"));
                        }
                        return sb.toString();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error comparing prices: {}", e.getMessage());
        }

        return String.format("You can compare live prices for **%s** across all verified partner pharmacies on the Medicine Search page.", term);
    }

    private List<AiChatResponse.ChatActionDto> generateStructuredActions(MedicalIntent intent, String medicineName) {
        List<AiChatResponse.ChatActionDto> actions = new ArrayList<>();
        String med = !medicineName.isEmpty() ? medicineName : "Paracetamol";

        switch (intent) {
            case MEDICINE_SIDE_EFFECTS -> {
                actions.add(new AiChatResponse.ChatActionDto("Find " + med, "MEDICINE_SEARCH", med));
                actions.add(new AiChatResponse.ChatActionDto("Check Prescription Rules", "ASK_QUESTION", "Can I take " + med + " without prescription?"));
                actions.add(new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NEARBY_PHARMACIES", "/dashboard/pharmacies"));
            }
            case MEDICINE_USES, MEDICINE_INFORMATION -> {
                actions.add(new AiChatResponse.ChatActionDto("Side Effects of " + med, "ASK_QUESTION", "What are the side effects of " + med + "?"));
                actions.add(new AiChatResponse.ChatActionDto("Find " + med, "MEDICINE_SEARCH", med));
                actions.add(new AiChatResponse.ChatActionDto("Check Stock in Pharmacies", "ASK_QUESTION", "Which pharmacy has " + med + " in stock?"));
            }
            case PHARMACY_STOCK, MEDICINE_SEARCH -> {
                actions.add(new AiChatResponse.ChatActionDto("Find " + med, "MEDICINE_SEARCH", med));
                actions.add(new AiChatResponse.ChatActionDto("Compare Prices", "ASK_QUESTION", "Compare " + med + " prices"));
                actions.add(new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NEARBY_PHARMACIES", "/dashboard/pharmacies"));
            }
            case PRICE_COMPARISON -> {
                actions.add(new AiChatResponse.ChatActionDto("Search " + med, "MEDICINE_SEARCH", med));
                actions.add(new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NEARBY_PHARMACIES", "/dashboard/pharmacies"));
            }
            case NEARBY_PHARMACIES -> {
                actions.add(new AiChatResponse.ChatActionDto("View Nearby Pharmacies", "NEARBY_PHARMACIES", "/dashboard/pharmacies"));
                actions.add(new AiChatResponse.ChatActionDto("Search Medicines", "MEDICINE_SEARCH", ""));
            }
            case PRESCRIPTION_HELP -> {
                actions.add(new AiChatResponse.ChatActionDto("Upload Prescription", "PRESCRIPTION_UPLOAD", "/dashboard/search?upload=true"));
                actions.add(new AiChatResponse.ChatActionDto("Search Medicines", "MEDICINE_SEARCH", ""));
            }
            case ORDER_HELP -> {
                actions.add(new AiChatResponse.ChatActionDto("View My Orders", "ORDERS", "/dashboard/orders"));
                actions.add(new AiChatResponse.ChatActionDto("Search Medicines", "MEDICINE_SEARCH", ""));
            }
            case RESERVATION_HELP -> {
                actions.add(new AiChatResponse.ChatActionDto("My Reservations", "RESERVATIONS", "/dashboard/reservations"));
                actions.add(new AiChatResponse.ChatActionDto("Search Medicines", "MEDICINE_SEARCH", ""));
            }
            default -> {
                actions.add(new AiChatResponse.ChatActionDto("Find Paracetamol", "MEDICINE_SEARCH", "Paracetamol"));
                actions.add(new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NEARBY_PHARMACIES", "/dashboard/pharmacies"));
                actions.add(new AiChatResponse.ChatActionDto("Upload Prescription", "PRESCRIPTION_UPLOAD", "/dashboard/search?upload=true"));
            }
        }
        return actions;
    }

    private String buildGroundedContext(String message, String resolvedMedicine, String prescriptionContext) {
        StringBuilder context = new StringBuilder();

        if (prescriptionContext != null && !prescriptionContext.isBlank()) {
            context.append("Prescription Extracted Information:\n")
                    .append(prescriptionContext.trim())
                    .append("\n\n");
        }

        // Clinical Knowledge Profile
        if (!resolvedMedicine.isEmpty()) {
            Optional<MedicalKnowledgeBase.MedicineProfile> profile = MedicalKnowledgeBase.findProfile(resolvedMedicine);
            if (profile.isPresent()) {
                var p = profile.get();
                context.append("MediFindAI Clinical Profile:\n")
                        .append("- Medicine: ").append(p.getName()).append(" (").append(p.getGenericName()).append(")\n")
                        .append("- Category: ").append(p.getCategory()).append("\n")
                        .append("- Prescription Required: ").append(p.isPrescriptionRequired() ? "Yes" : "No (OTC)").append("\n")
                        .append("- Indications: ").append(p.getIndications()).append("\n")
                        .append("- Side Effects: ").append(p.getSideEffects()).append("\n")
                        .append("- Precautions: ").append(p.getPrecautions()).append("\n")
                        .append("- Interactions: ").append(p.getInteractions()).append("\n")
                        .append("- Alternatives: ").append(p.getAlternatives()).append("\n\n");
            }
        }

        // Database Catalog & Live Stock
        String term = !resolvedMedicine.isEmpty() ? resolvedMedicine : extractRawSearchTerm(message);
        if (!term.isEmpty()) {
            try {
                Page<Medicine> page = medicineRepository.searchByNameOrGeneric(term, PageRequest.of(0, 3));
                List<Medicine> matches = (page != null && page.getContent() != null) ? page.getContent() : Collections.emptyList();

                if (!matches.isEmpty()) {
                    context.append("MediFindAI Live Catalog & Stock Data:\n");
                    for (Medicine m : matches) {
                        List<MedicineStock> stocks = medicineStockRepository.findByMedicineId(m.getId());
                        long activeCount = stocks.stream()
                                .filter(s -> s.getPharmacy() != null && s.getPharmacy().isActive() && s.getQuantity() > 0)
                                .count();

                        BigDecimal minPrice = stocks.stream()
                                .filter(s -> s.getPharmacy() != null && s.getPharmacy().isActive())
                                .map(MedicineStock::getPrice)
                                .min(BigDecimal::compareTo)
                                .orElse(null);

                        context.append(String.format(
                                "- Catalog Name: %s, Form: %s, Strength: %s, Rx Required: %s\n" +
                                "  Live Stock: in stock at %d partner pharmacies%s.\n",
                                m.getName(),
                                m.getDosageForm() != null ? m.getDosageForm() : "Tablet",
                                m.getStrength() != null ? m.getStrength() : "N/A",
                                m.isRequiresPrescription() ? "Yes" : "No (OTC)",
                                activeCount,
                                minPrice != null ? " starting at ₹" + minPrice : ""
                        ));
                    }
                }
            } catch (Exception e) {
                log.warn("Could not query medicine catalog: {}", e.getMessage());
            }
        }

        return context.toString();
    }

    private String extractRawSearchTerm(String text) {
        String lower = text.toLowerCase(Locale.ROOT).trim();
        String[] prefixes = {
                "find ", "search for ", "search ", "look for ", "where is ", "price of ",
                "cost of ", "tell me about ", "what is ", "uses of ", "side effects of ",
                "alternatives to ", "substitute for ", "can i take "
        };
        for (String prefix : prefixes) {
            if (lower.startsWith(prefix)) {
                String candidate = lower.substring(prefix.length()).trim();
                candidate = candidate.replaceAll("[?.!,;:]+$", "").trim();
                if (!candidate.isEmpty() && candidate.length() < 50) {
                    return candidate;
                }
            }
        }
        return "";
    }

    private AiChatResponse buildWelcomeResponse(String sessionId) {
        return AiChatResponse.builder()
                .reply("Hello! I am your **MediFindAI Assistant**. How can I help you find medicines, check live pharmacy stock, or explain indications and side effects today?")
                .intent("greetings")
                .disclaimer(SAFETY_DISCLAIMER)
                .actions(List.of(
                        new AiChatResponse.ChatActionDto("Find Paracetamol", "MEDICINE_SEARCH", "Paracetamol"),
                        new AiChatResponse.ChatActionDto("Side effects of Paracetamol", "ASK_QUESTION", "What are the side effects of Paracetamol?"),
                        new AiChatResponse.ChatActionDto("Nearby Pharmacies", "NEARBY_PHARMACIES", "/dashboard/pharmacies"),
                        new AiChatResponse.ChatActionDto("Upload Prescription", "PRESCRIPTION_UPLOAD", "/dashboard/prescriptions")
                ))
                .suggestedActions(List.of("Find Paracetamol", "Side effects of Paracetamol", "Nearby Pharmacies", "Upload Prescription"))
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
