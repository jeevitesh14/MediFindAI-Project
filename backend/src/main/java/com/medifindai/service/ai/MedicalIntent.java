package com.medifindai.service.ai;

import java.util.Locale;

public enum MedicalIntent {
    GREETING("greetings"),
    MEDICINE_SEARCH("medicine_search"),
    MEDICINE_USES("medicine_uses"),
    MEDICINE_SIDE_EFFECTS("medicine_side_effects"),
    MEDICINE_INFORMATION("medicine_information"),
    DRUG_INTERACTIONS("drug_interactions"),
    MEDICINE_ALTERNATIVES("medicine_alternatives"),
    PHARMACY_STOCK("pharmacy_stock"),
    NEARBY_PHARMACIES("nearby_pharmacies"),
    PRICE_COMPARISON("price_comparison"),
    PRESCRIPTION_REQUIREMENT("prescription_requirement"),
    PRESCRIPTION_HELP("prescription_help"),
    SYMPTOMS_HEALTH("symptoms_health"),
    ORDER_HELP("order_help"),
    RESERVATION_HELP("reservation_help"),
    GENERAL_CONVERSATION("general_conversation"),
    UNKNOWN("unknown");

    private final String value;

    MedicalIntent(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static MedicalIntent classify(String input, boolean hasMedicine) {
        if (input == null || input.isBlank()) {
            return GREETING;
        }

        String lower = input.toLowerCase(Locale.ROOT).trim();

        // 1. Greetings
        if (lower.matches("^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)[!.?]*$")) {
            return GREETING;
        }

        // 2. Orders Help
        if (lower.contains("my order") || lower.contains("show orders") || lower.contains("track order") ||
                lower.contains("order history") || lower.contains("past order") || lower.contains("order status") ||
                lower.contains("show my order") || lower.contains("view order") || lower.contains("my orders") ||
                lower.equals("orders")) {
            return ORDER_HELP;
        }

        // 3. Reservations Help
        if (lower.contains("reserve") || lower.contains("reservation") ||
                lower.contains("pickup hold") || lower.contains("how does pickup hold work") ||
                lower.contains("how to reserve") || lower.contains("my reservation") ||
                lower.contains("hold a medicine") || lower.contains("book a medicine") ||
                lower.contains("hold medicine") || lower.contains("book medicine") ||
                lower.contains("can i reserve") || lower.contains("how do i reserve")) {
            return RESERVATION_HELP;
        }

        // 4. Prescription upload / help
        if (lower.contains("upload my prescription") || lower.contains("upload prescription") ||
                lower.contains("doctor gave me a prescription") || lower.contains("have a prescription") ||
                lower.contains("where can i upload") || lower.contains("scan prescription") ||
                lower.contains("prescription ocr")) {
            return PRESCRIPTION_HELP;
        }

        // 5. Drug Interactions (e.g. "Can I take paracetamol with ibuprofen", "take with alcohol")
        if (lower.contains("with ibuprofen") || lower.contains("with paracetamol") ||
                lower.contains("with alcohol") || lower.contains("drug interaction") ||
                lower.contains("together") || lower.contains("take with") ||
                lower.contains("interact with") || lower.contains("combined with")) {
            return DRUG_INTERACTIONS;
        }

        // 6. Alternatives (e.g. "alternatives to paracetamol", "substitute for")
        if (lower.contains("alternative") || lower.contains("substitute") || lower.contains("instead of") ||
                lower.contains("other options for")) {
            return MEDICINE_ALTERNATIVES;
        }

        // 7. Side effects
        if (lower.contains("side effect") || lower.contains("adverse effect") ||
                lower.contains("reactions") || lower.contains("safety of") ||
                lower.contains("risk of taking") || lower.contains("harmful") ||
                lower.contains("bad effects")) {
            return MEDICINE_SIDE_EFFECTS;
        }

        // 8. Uses / Indications / What is it for
        if (lower.contains("used for") || lower.contains("uses of") || lower.contains("what does") ||
                lower.contains("how does it work") || lower.contains("why take") ||
                lower.contains("indication") || lower.contains("purpose of")) {
            return MEDICINE_USES;
        }

        // 9. Prescription requirement (e.g. "without prescription", "need prescription", "need rx", "is it otc")
        if (lower.contains("without prescription") || lower.contains("need prescription") ||
                lower.contains("need a prescription") || lower.contains("require prescription") ||
                lower.contains("prescription required") || lower.contains("is it otc") ||
                lower.contains("over the counter") || lower.contains("need rx") || lower.contains("doctor note")) {
            return PRESCRIPTION_REQUIREMENT;
        }

        // 10. Price comparison (e.g. "cheapest paracetamol", "compare prices", "cost of")
        if (lower.contains("cheapest") || lower.contains("compare") || lower.contains("price comparison") ||
                lower.contains("cost comparison") || lower.contains("best price") || lower.contains("lowest price")) {
            return PRICE_COMPARISON;
        }

        // 11. Pharmacy stock (e.g. "which pharmacy has paracetamol", "in stock", "who has stock")
        if (lower.contains("which pharmacy has") || lower.contains("in stock") ||
                lower.contains("available in pharmacy") || lower.contains("stock availability") ||
                lower.contains("have stock") || lower.contains("out of stock")) {
            return PHARMACY_STOCK;
        }

        // 12. Nearby pharmacies / Geolocation (e.g. "pharmacies nearby", "near me", "where can i get", "pharmacies close")
        if (lower.contains("near me") || lower.contains("nearby") || lower.contains("closest pharmacy") ||
                lower.contains("where can i find") || lower.contains("where can i get") ||
                lower.contains("what pharmacies are") || lower.contains("which pharmacies are") ||
                lower.contains("pharmacies around") || lower.contains("pharmacies near") ||
                lower.contains("pharmacy near") || lower.contains("close to me") ||
                lower.contains("local pharmacies") || lower.contains("find pharmacies") ||
                lower.contains("find a pharmacy") || lower.contains("partner pharmacies")) {
            return NEARBY_PHARMACIES;
        }

        // 13. Symptoms / General Health inquiry (e.g. "medicine for a headache", "fever remedies", "throat pain")
        if (lower.contains("medicine for") || lower.contains("cure for") || lower.contains("headache") ||
                lower.contains("fever") || lower.contains("body pain") || lower.contains("stomach ache") ||
                lower.contains("cough") || lower.contains("cold") || lower.contains("sore throat") ||
                lower.contains("allergy") || lower.contains("heartburn") || lower.contains("acidity")) {
            return SYMPTOMS_HEALTH;
        }

        // 14. Medicine Search intent ("find paracetamol", "search for amoxicillin")
        if (lower.startsWith("find ") || lower.startsWith("search ") || lower.startsWith("look for ") ||
                lower.startsWith("locate ") || lower.startsWith("buy ")) {
            return MEDICINE_SEARCH;
        }

        // 15. General Medicine Information ("what is paracetamol", "tell me about amoxicillin")
        if (hasMedicine || lower.startsWith("what is ") || lower.startsWith("tell me about ") ||
                lower.startsWith("explain ")) {
            return MEDICINE_INFORMATION;
        }

        return UNKNOWN;
    }
}
