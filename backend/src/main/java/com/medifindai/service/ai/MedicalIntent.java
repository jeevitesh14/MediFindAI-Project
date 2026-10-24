package com.medifindai.service.ai;

import lombok.Getter;

import java.util.Locale;

public enum MedicalIntent {
    MEDICAL_INFORMATION("MEDICAL_INFORMATION"),
    MEDICINE_SEARCH("MEDICINE_SEARCH"),
    PHARMACY_SEARCH("PHARMACY_SEARCH"),
    PRICE_AVAILABILITY("PRICE_AVAILABILITY"),
    RESERVATION_HELP("RESERVATION_HELP"),
    PRESCRIPTION_HELP("PRESCRIPTION_HELP"),
    ORDER_HELP("ORDER_HELP"),
    APP_NAVIGATION("APP_NAVIGATION"),
    GENERAL_CONVERSATION("GENERAL_CONVERSATION"),
    CLARIFICATION_REQUIRED("CLARIFICATION_REQUIRED");

    private final String value;

    MedicalIntent(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Getter
    public static class NavigationTarget {
        private final String route;
        private final String destinationName;
        private final boolean requiresAuth;

        public NavigationTarget(String route, String destinationName, boolean requiresAuth) {
            this.route = route;
            this.destinationName = destinationName;
            this.requiresAuth = requiresAuth;
        }
    }

    /**
     * Identifies if a message is an explicit navigation request and resolves the target.
     */
    public static NavigationTarget resolveNavigationTarget(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String lower = input.toLowerCase(Locale.ROOT).trim()
                .replaceAll("[!.?]+$", "").trim();

        // Must match an explicit navigation directive: "open ...", "take me to ...", "go to ...", "navigate to ...", "visit ..."
        boolean isNavDirective = lower.startsWith("open ") ||
                lower.startsWith("go to ") ||
                lower.startsWith("goto ") ||
                lower.startsWith("take me to ") ||
                lower.startsWith("navigate to ") ||
                lower.startsWith("visit ");

        if (!isNavDirective) {
            return null;
        }

        // Extract the target phrase after the command
        String target = lower
                .replaceFirst("^(open|go to|goto|take me to|navigate to|visit)\\s+(the\\s+)?", "")
                .replaceFirst("\\s+page$", "")
                .replaceFirst("\\s+screen$", "")
                .replaceFirst("\\s+section$", "")
                .trim();

        // 1. Medicine Search
        if (target.contains("search") || target.contains("medicine") || target.contains("catalog") || target.equals("medicines")) {
            return new NavigationTarget("/dashboard/search", "Medicine Search", false);
        }

        // 2. Nearby Pharmacies
        if (target.contains("pharmacy") || target.contains("pharmacies") || target.contains("nearby") || target.contains("map")) {
            return new NavigationTarget("/dashboard/pharmacies", "Nearby Pharmacies", false);
        }

        // 3. Reservations
        if (target.contains("reservation") || target.contains("pickup hold") || target.contains("my hold")) {
            return new NavigationTarget("/dashboard/reservations", "My Reservations", true);
        }

        // 4. Orders
        if (target.contains("order")) {
            return new NavigationTarget("/dashboard/orders", "My Orders", true);
        }

        // 5. Prescription Upload
        if (target.contains("prescription") || target.contains("upload") || target.contains("rx")) {
            return new NavigationTarget("/dashboard/search?upload=true", "Prescription Upload", false);
        }

        // 6. Cart
        if (target.contains("cart")) {
            return new NavigationTarget("/cart", "Cart", false);
        }

        // 7. Checkout
        if (target.contains("checkout")) {
            return new NavigationTarget("/checkout", "Checkout", true);
        }

        // 8. Dashboard / Home
        if (target.contains("dashboard") || target.contains("home")) {
            return new NavigationTarget("/dashboard", "Dashboard", true);
        }

        // 9. Login
        if (target.contains("login") || target.contains("sign in")) {
            return new NavigationTarget("/login", "Login", false);
        }

        return null;
    }

    /**
     * Classifies a user query into one of the 10 standardized intent categories.
     */
    public static MedicalIntent classify(String input, boolean hasMedicine) {
        if (input == null || input.isBlank()) {
            return GENERAL_CONVERSATION;
        }

        String lower = input.toLowerCase(Locale.ROOT).trim();

        // --- 1. Explicit Navigation Intent (Highest priority when command is explicit) ---
        if (resolveNavigationTarget(input) != null) {
            return APP_NAVIGATION;
        }

        // --- 2. Ambiguous / Vague queries -> CLARIFICATION_REQUIRED ---
        if (isAmbiguousQuery(lower)) {
            return CLARIFICATION_REQUIRED;
        }

        // --- 3. General Greetings / Conversation ---
        if (lower.matches("^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|what's up|sup)[!.?]*$") ||
                lower.matches("^(thanks|thank you|thank you so much|thx|bye|goodbye|see ya)[!.?]*$") ||
                lower.contains("who are you") || lower.contains("what can you do") || lower.contains("help me")) {
            return GENERAL_CONVERSATION;
        }

        // --- 4. Orders Help ---
        // Questions or requests to view order status/history (e.g. "what is the status of my order?", "show my orders")
        if (lower.contains("order status") || lower.contains("status of my order") ||
                lower.contains("track order") || lower.contains("track my order") ||
                lower.contains("my order") || lower.contains("my orders") ||
                lower.contains("show orders") || lower.contains("show my orders") ||
                lower.contains("order history") || lower.contains("past order") ||
                lower.equals("orders")) {
            return ORDER_HELP;
        }

        // --- 5. Reservations Help ---
        // Questions about pickup holds, how to reserve, or displaying user reservations
        if (lower.contains("reserve") || lower.contains("reservation") ||
                lower.contains("pickup hold") || lower.contains("how does pickup hold work") ||
                lower.contains("how to reserve") || lower.contains("how do i reserve") ||
                lower.contains("can i reserve") || lower.contains("hold a medicine") ||
                lower.contains("book a medicine") || lower.contains("hold medicine") ||
                lower.contains("my reservation") || lower.contains("show my reservations") ||
                lower.contains("what are my reservations") || lower.equals("reservations")) {
            return RESERVATION_HELP;
        }

        // --- 6. Prescription Help & Requirements ---
        // Upload guidelines, OCR help, or prescription requirement inquiries
        if (lower.contains("upload prescription") || lower.contains("upload my prescription") ||
                lower.contains("how to upload") || lower.contains("how can i upload") ||
                lower.contains("scan prescription") || lower.contains("prescription ocr") ||
                lower.contains("where can i upload") || lower.contains("doctor gave me a prescription") ||
                lower.contains("have a prescription") || lower.contains("without prescription") ||
                lower.contains("need prescription") || lower.contains("need a prescription") ||
                lower.contains("require prescription") || lower.contains("prescription required") ||
                lower.contains("is it otc") || lower.contains("over the counter") ||
                lower.contains("need rx") || lower.equals("upload prescription")) {
            return PRESCRIPTION_HELP;
        }

        // --- 7. Price & Availability / Live Stock Inquiries ---
        // "Which pharmacies have Paracetamol in stock?", "What is the price of Paracetamol?", "Compare prices"
        if (lower.contains("which pharmacy has") || lower.contains("which pharmacies have") ||
                lower.contains("in stock") || lower.contains("stock in") ||
                lower.contains("available in pharmacy") || lower.contains("stock availability") ||
                lower.contains("have stock") || lower.contains("out of stock") ||
                lower.contains("price of") || lower.contains("what is the price") ||
                lower.contains("how much does") || lower.contains("how much is") ||
                lower.contains("cost of") || lower.contains("cheapest") ||
                lower.contains("compare price") || lower.contains("compare prices") ||
                lower.contains("price comparison") || lower.contains("best price") ||
                lower.contains("lowest price")) {
            return PRICE_AVAILABILITY;
        }

        // --- 8. Pharmacy Search / Nearby Pharmacies ---
        // "Find pharmacies near Hyderabad", "Nearby pharmacies", "Where can I get medicines?"
        if (lower.contains("near me") || lower.contains("nearby pharmacies") || lower.contains("nearby pharmacy") ||
                lower.contains("nearby") || lower.contains("closest pharmacy") ||
                lower.contains("closest pharmacies") || lower.contains("where can i find") ||
                lower.contains("where can i get") || lower.contains("pharmacies near") ||
                lower.contains("pharmacy near") || lower.contains("pharmacies in") ||
                lower.contains("pharmacy in") || lower.contains("pharmacies around") ||
                lower.contains("local pharmacies") || lower.contains("find pharmacies") ||
                lower.contains("find a pharmacy") || lower.contains("partner pharmacies") ||
                lower.equals("nearby pharmacies")) {
            return PHARMACY_SEARCH;
        }

        // --- 9. Medicine Search ---
        // "Find Paracetamol", "Search Amoxicillin", "Look for Cetirizine"
        if (lower.startsWith("find ") || lower.startsWith("search ") ||
                lower.startsWith("look for ") || lower.startsWith("locate ") ||
                lower.startsWith("buy ") || lower.equals("find paracetamol") ||
                lower.equals("search medicines")) {
            return MEDICINE_SEARCH;
        }

        // --- 10. Medical Information ---
        // Indications, uses, side effects, precautions, drug interactions, alternatives, symptoms
        if (lower.contains("side effect") || lower.contains("side effects") ||
                lower.contains("adverse effect") || lower.contains("reactions") ||
                lower.contains("used for") || lower.contains("uses of") ||
                lower.contains("what does") || lower.contains("how does it work") ||
                lower.contains("why take") || lower.contains("indication") ||
                lower.contains("interactions") || lower.contains("interact with") ||
                lower.contains("take with") || lower.contains("together") ||
                lower.contains("alternative") || lower.contains("substitute") ||
                lower.contains("instead of") || lower.contains("medicine for") ||
                lower.contains("cure for") || lower.contains("headache") ||
                lower.contains("fever") || lower.contains("pain") ||
                lower.contains("cough") || lower.contains("cold") ||
                lower.startsWith("what is ") || lower.startsWith("explain ") ||
                lower.startsWith("tell me about ") || hasMedicine) {
            return MEDICAL_INFORMATION;
        }

        return GENERAL_CONVERSATION;
    }

    private static boolean isAmbiguousQuery(String lower) {
        // Single ambiguous words that provide no actionable intent
        String cleaned = lower.replaceAll("[?.!,;:]+$", "").trim();
        return cleaned.equals("medicine") ||
                cleaned.equals("medicines") ||
                cleaned.equals("pharmacy") ||
                cleaned.equals("pharmacies") ||
                cleaned.equals("help") ||
                cleaned.equals("check") ||
                cleaned.equals("status") ||
                cleaned.equals("info") ||
                cleaned.equals("information") ||
                cleaned.equals("paracetamol") ||
                cleaned.equals("amoxicillin");
    }
}
