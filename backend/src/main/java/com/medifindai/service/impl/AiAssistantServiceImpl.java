package com.medifindai.service.impl;

import com.medifindai.dto.ai.AiChatRequest;
import com.medifindai.dto.ai.AiChatResponse;
import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import com.medifindai.service.AiAssistantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantServiceImpl implements AiAssistantService {

    public static final String SAFETY_DISCLAIMER =
            "MediFindAI does not provide medical advice. Consult a qualified healthcare professional for medical guidance.";

    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository medicineStockRepository;

    @Value("${app.external.gemini-api-key:}")
    private String geminiApiKey;

    @Value("${app.external.openai-api-key:}")
    private String openAiApiKey;

    @Override
    public AiChatResponse generateReply(AiChatRequest request) {
        String message = request.getMessage() != null ? request.getMessage().trim() : "";
        if (message.isEmpty()) {
            return AiChatResponse.builder()
                    .reply("Hello! I am your MediFindAI Assistant. How can I help you find medicines or check pharmacy availability today?")
                    .disclaimer(SAFETY_DISCLAIMER)
                    .suggestedActions(List.of("Find Paracetamol", "Which pharmacy has medicine in stock?", "Do I need a prescription?"))
                    .fallbackMode(true)
                    .build();
        }

        String lower = message.toLowerCase(Locale.ROOT);

        // 1. Guardrail against medical diagnosis or dosage questions
        if (isDiagnosisOrDosageQuery(lower)) {
            return AiChatResponse.builder()
                    .reply("I cannot provide medical diagnoses, treatment plans, or dosage recommendations. For health concerns and medication dosages, please consult a qualified doctor or licensed pharmacist. I can help you find where specific medicines are in stock near you.")
                    .disclaimer(SAFETY_DISCLAIMER)
                    .suggestedActions(List.of("Search Medicines", "Find Paracetamol", "View Pharmacies"))
                    .fallbackMode(true)
                    .build();
        }

        // 2. Prescription information queries
        if (lower.contains("prescription") || lower.contains("need rx") || lower.contains("doctor note")) {
            return AiChatResponse.builder()
                    .reply("Medicines marked with 'Prescription required' (such as antibiotics like Azithromycin or chronic care medicines) require a valid doctor's prescription when picking them up at the pharmacy. Over-the-counter (OTC) products like Paracetamol or Antacids can be purchased without a prescription. You can see the prescription badge on each medicine in the Search page.")
                    .disclaimer(SAFETY_DISCLAIMER)
                    .suggestedActions(List.of("Find Paracetamol", "Search Antibiotics", "Nearby Pharmacies"))
                    .fallbackMode(true)
                    .build();
        }

        // 3. Stock / Pharmacy availability queries
        if (lower.contains("which pharmacy") || (lower.contains("pharmacy") && lower.contains("stock")) || lower.contains("in stock")) {
            return AiChatResponse.builder()
                    .reply("MediFindAI tracks live inventory across verified partner pharmacies (such as Apollo Care, MedPlus Express, and HealthFirst Pharmacy). You can search for any medicine on the Medicine Search page to view stock levels (Available, Low Stock, or Out of Stock) and compare prices.")
                    .disclaimer(SAFETY_DISCLAIMER)
                    .suggestedActions(List.of("Search Paracetamol", "Compare Prices", "Nearby Pharmacies"))
                    .fallbackMode(true)
                    .build();
        }

        // 4. How reservation works
        if (lower.contains("reserve") || lower.contains("reservation") || lower.contains("pickup") || lower.contains("pick up") || lower.contains("how it works")) {
            return AiChatResponse.builder()
                    .reply("With MediFindAI, you can search for a medicine, compare pharmacy prices, and place a reservation for pickup. Once reserved, the pharmacy holds your medicine for 24 hours. Simply visit the pharmacy counter and present your reservation code.")
                    .disclaimer(SAFETY_DISCLAIMER)
                    .suggestedActions(List.of("Search Medicines", "Find Paracetamol", "View Nearby Pharmacies"))
                    .fallbackMode(true)
                    .build();
        }

        // 5. Medicine search query (e.g. "Find Paracetamol", "Do you have Amoxicillin", "Cetirizine", etc.)
        String extractedMedicine = extractMedicineName(lower);
        if (!extractedMedicine.isEmpty()) {
            return handleMedicineLookup(extractedMedicine);
        }

        // 6. Generic intelligent fallback response
        return AiChatResponse.builder()
                .reply("I can help you search for medicines, check real-time stock across local pharmacies, compare prices, and explain prescription requirements. What medicine are you looking for?")
                .disclaimer(SAFETY_DISCLAIMER)
                .suggestedActions(List.of("Find Paracetamol", "Which pharmacy has medicine in stock?", "Do I need a prescription?"))
                .fallbackMode(true)
                .build();
    }

    private boolean isDiagnosisOrDosageQuery(String text) {
        return text.contains("how many should i take") ||
                text.contains("how much should i take") ||
                text.contains("what dose") ||
                text.contains("dosage for") ||
                text.contains("diagnose") ||
                text.contains("what illness") ||
                text.contains("what disease") ||
                text.contains("symptoms of") ||
                text.contains("cure for") ||
                text.contains("how to cure") ||
                text.contains("chest pain") ||
                text.contains("can i take with alcohol");
    }

    private String extractMedicineName(String lower) {
        String[] prefixes = {
                "find ", "search for ", "search ", "looking for ", "do you have ", "where is ",
                "check ", "price of ", "availability of ", "cost of "
        };
        for (String prefix : prefixes) {
            if (lower.startsWith(prefix)) {
                return lower.substring(prefix.length()).trim();
            }
        }
        if (lower.contains("paracetamol")) return "paracetamol";
        if (lower.contains("azithromycin")) return "azithromycin";
        if (lower.contains("cetirizine")) return "cetirizine";
        if (lower.contains("pantoprazole")) return "pantoprazole";
        if (lower.contains("ibuprofen")) return "ibuprofen";
        if (lower.contains("amoxicillin")) return "amoxicillin";
        if (lower.contains("metformin")) return "metformin";
        if (lower.contains("amlodipine")) return "amlodipine";
        if (lower.contains("vitamin d")) return "vitamin d";

        return "";
    }

    private AiChatResponse handleMedicineLookup(String term) {
        try {
            List<Medicine> matches = medicineRepository
                    .searchByNameOrGeneric(term, PageRequest.of(0, 3))
                    .getContent();

            if (!matches.isEmpty()) {
                Medicine first = matches.get(0);
                List<MedicineStock> stocks = medicineStockRepository.findByMedicineId(first.getId());
                long availableCount = stocks.stream()
                        .filter(s -> s.getPharmacy().isActive() && s.getQuantity() > 0)
                        .count();

                java.math.BigDecimal minPrice = stocks.stream()
                        .filter(s -> s.getPharmacy().isActive())
                        .map(MedicineStock::getPrice)
                        .min(java.math.BigDecimal::compareTo)
                        .orElse(null);

                StringBuilder reply = new StringBuilder();
                reply.append(String.format("Found '%s' (%s - %s %s). ",
                        first.getName(),
                        first.getGenericName() != null ? first.getGenericName() : "General",
                        first.getDosageForm() != null ? first.getDosageForm() : "",
                        first.getStrength() != null ? first.getStrength() : ""));

                if (first.isRequiresPrescription()) {
                    reply.append("⚠️ Prescription required. ");
                } else {
                    reply.append("✓ Over-the-counter. ");
                }

                if (availableCount > 0 && minPrice != null) {
                    reply.append(String.format(java.util.Locale.US, "Available at %d partner %s starting from ₹%.2f. Head to the Search page to compare all pharmacies and reserve.",
                            availableCount,
                            availableCount == 1 ? "pharmacy" : "pharmacies",
                            minPrice.doubleValue()));
                } else {
                    reply.append("You can check full pharmacy listings and stock details on the Medicine Search page.");
                }

                List<String> actions = new ArrayList<>();
                actions.add("Search " + first.getName());
                actions.add("Check Pharmacy Stock");
                actions.add("Do I need a prescription?");

                return AiChatResponse.builder()
                        .reply(reply.toString())
                        .disclaimer(SAFETY_DISCLAIMER)
                        .suggestedActions(actions)
                        .fallbackMode(true)
                        .build();
            }
        } catch (Exception e) {
            log.warn("Database lookup in AI Assistant failed, using safe static response: {}", e.getMessage());
        }

        return AiChatResponse.builder()
                .reply(String.format("I can help you search for '%s'. Please use the Medicine Search page to see real-time availability, nearby pharmacy distance, and price comparisons.", term))
                .disclaimer(SAFETY_DISCLAIMER)
                .suggestedActions(List.of("Search " + term, "Nearby Pharmacies", "Do I need a prescription?"))
                .fallbackMode(true)
                .build();
    }
}
