package com.medifindai.service.ocr;

import com.medifindai.dto.medicine.MedicineSearchResponse;
import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicineMatcherService {

    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository medicineStockRepository;

    private static final Set<String> NOISE_WORDS = Set.of(
            "dr", "doctor", "clinic", "hospital", "pharmacy", "medical", "centre", "center",
            "patient", "name", "age", "sex", "gender", "date", "address", "phone", "email",
            "rx", "sig", "od", "bd", "bid", "tds", "tid", "qid", "sos", "hs", "prn",
            "tab", "tablet", "tablets", "cap", "capsule", "capsules", "syp", "syrup",
            "inj", "injection", "ointment", "gel", "cream", "drops", "lotion",
            "mg", "ml", "gm", "g", "mcg", "iu", "units", "pills", "strips",
            "morning", "afternoon", "evening", "night", "bedtime", "daily", "weekly",
            "before", "after", "food", "meals", "water", "days", "weeks", "months",
            "take", "apply", "use", "qty", "quantity", "total", "sign", "signature",
            "diagnosis", "advice", "instructions", "notes", "prescription", "consultation"
    );

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-zA-Z0-9\\s]");

    private static final Pattern CANDIDATE_PREFIX = Pattern.compile("^(?:\\d+[.)\\-:]|rx[:.]?|tab[.:]?|cap[.:]?|syrup[.:]?|inj[.:]?|•|-|\\*)\\s*", Pattern.CASE_INSENSITIVE);
    private static final Pattern DOSAGE_PATTERN = Pattern.compile("(?i)\\b(\\d+(?:\\.\\d+)?\\s*(?:mg|ml|gm|g|mcg|iu))\\b");
    private static final Pattern FREQUENCY_PATTERN = Pattern.compile("(?i)\\b(?:1\\s*tab|2\\s*tabs?|od|bd|bid|tds|tid|qid|sos|hs|prn|once|twice|daily|after\\s+food|before\\s+food|for\\s+\\d+\\s+days?)\\b.*$");

    /**
     * Conservatively matches medicine entities from raw OCR text against the database,
     * and accurately tracks unmatched prescribed medicines.
     */
    @Transactional(readOnly = true)
    public MedicineMatchResult matchMedicinesFromText(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new MedicineMatchResult(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    "The prescription image could not be read. Please upload a clearer image."
            );
        }

        String normalizedText = rawText.toLowerCase();
        Map<Long, Medicine> matchedMedicineMap = new LinkedHashMap<>();
        Set<String> detectedNames = new LinkedHashSet<>();
        Set<String> unmatchedNames = new LinkedHashSet<>();

        // 1. Direct scan: check if known medicine names or generic names exist in rawText
        List<Medicine> allMedicines = medicineRepository.findAll();
        for (Medicine medicine : allMedicines) {
            String nameLower = medicine.getName().toLowerCase();
            String genericLower = medicine.getGenericName() != null ? medicine.getGenericName().toLowerCase() : "";

            // Check brand name match
            if (isWordInText(nameLower, normalizedText)) {
                matchedMedicineMap.put(medicine.getId(), medicine);
                detectedNames.add(medicine.getName());
                continue;
            }

            // Check generic name match
            if (!genericLower.isBlank() && isWordInText(genericLower, normalizedText)) {
                matchedMedicineMap.put(medicine.getId(), medicine);
                detectedNames.add(medicine.getName());
            }
        }

        // 2. Scan lines for candidate prescribed medicines that might not be in our database
        String[] lines = rawText.split("\\r?\\n");
        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.length() < 3) continue;

            String lineLower = line.toLowerCase();
            if (isNoiseLine(lineLower)) continue;

            // Check if line contains a dosage indicator (e.g. "500mg", "20mg", "10ml")
            var dosageMatcher = DOSAGE_PATTERN.matcher(line);
            if (dosageMatcher.find()) {
                // Extract candidate name: strip prefix and trailing instructions
                String candidate = CANDIDATE_PREFIX.matcher(line).replaceFirst("");
                candidate = FREQUENCY_PATTERN.matcher(candidate).replaceFirst("").trim();
                candidate = candidate.replaceAll("[,;:]+$", "").trim();

                if (candidate.length() >= 3 && !isNoiseLine(candidate.toLowerCase())) {
                    final String candidateLower = candidate.toLowerCase();
                    // Check if already covered by matched medicines
                    boolean alreadyMatched = matchedMedicineMap.values().stream()
                            .anyMatch(m -> isWordInText(m.getName().toLowerCase(), candidateLower) ||
                                           (m.getGenericName() != null && isWordInText(m.getGenericName().toLowerCase(), candidateLower)));

                    if (!alreadyMatched) {
                        // Attempt fallback token search in DB
                        String firstToken = candidate.replaceAll("[^a-zA-Z0-9]", " ").trim().split("\\s+")[0];
                        List<Medicine> dbFound = Collections.emptyList();
                        if (firstToken.length() >= 4 && !NOISE_WORDS.contains(firstToken.toLowerCase())) {
                            var page = medicineRepository.searchByNameOrGeneric(firstToken, Pageable.ofSize(1));
                            if (page != null) {
                                dbFound = page.getContent();
                            }
                        }

                        if (!dbFound.isEmpty()) {
                            Medicine m = dbFound.get(0);
                            matchedMedicineMap.put(m.getId(), m);
                            detectedNames.add(m.getName());
                        } else {
                            unmatchedNames.add(candidate);
                            detectedNames.add(candidate);
                        }
                    }
                }
            }
        }

        // 3. Token-based fallback if nothing was matched yet
        if (matchedMedicineMap.isEmpty()) {
            String cleaned = NON_ALPHANUMERIC.matcher(normalizedText).replaceAll(" ");
            String[] tokens = cleaned.split("\\s+");

            for (String token : tokens) {
                if (token.length() >= 4 && !NOISE_WORDS.contains(token)) {
                    List<Medicine> found = medicineRepository.searchByNameOrGeneric(token, Pageable.ofSize(3)).getContent();
                    for (Medicine m : found) {
                        matchedMedicineMap.put(m.getId(), m);
                        detectedNames.add(m.getName());
                    }
                }
            }
        }

        // 4. Build response with live pharmacy prices and stock
        List<MedicineSearchResponse> searchResponses = matchedMedicineMap.values().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        // 5. Generate descriptive status message
        String statusMessage;
        if (detectedNames.isEmpty()) {
            statusMessage = "No medicine names could be extracted. Please try a clearer image.";
        } else if (!searchResponses.isEmpty() && unmatchedNames.isEmpty()) {
            statusMessage = "Prescription analyzed and all medicines matched successfully.";
        } else if (!searchResponses.isEmpty() && !unmatchedNames.isEmpty()) {
            statusMessage = "Some extracted medicines could not be matched with our inventory.";
        } else {
            statusMessage = "Detected medicine names could not be found in our registered pharmacy inventory.";
        }

        return new MedicineMatchResult(
                new ArrayList<>(detectedNames),
                searchResponses,
                new ArrayList<>(unmatchedNames),
                statusMessage
        );
    }

    private boolean isNoiseLine(String lineLower) {
        if (lineLower.startsWith("dr.") || lineLower.startsWith("dr ") ||
                lineLower.contains("clinic") || lineLower.contains("hospital") ||
                lineLower.contains("patient") || lineLower.contains("address") ||
                lineLower.contains("signature") || lineLower.contains("phone:") ||
                lineLower.contains("date:") || lineLower.contains("age:") || lineLower.contains("sex:")) {
            return true;
        }
        return false;
    }

    private boolean isWordInText(String target, String fullText) {
        if (target.isBlank() || fullText.isBlank()) {
            return false;
        }

        // Check exact match or boundary match for clean tokens
        String simplifiedTarget = target.replaceAll("[^a-zA-Z0-9]", " ").trim();
        if (simplifiedTarget.isBlank()) return false;

        // Try single major token (e.g., "Paracetamol" in "Paracetamol 500mg")
        String firstWord = simplifiedTarget.split("\\s+")[0];
        if (firstWord.length() >= 3 && !NOISE_WORDS.contains(firstWord)) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(firstWord) + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(fullText).find()) {
                return true;
            }
        }

        return fullText.contains(target);
    }

    private MedicineSearchResponse toResponse(Medicine medicine) {
        List<MedicineSearchResponse.PharmacyResult> pharmacies =
                medicineStockRepository.findByMedicineId(medicine.getId())
                        .stream()
                        .filter(stock -> stock.getPharmacy().isActive())
                        .sorted(Comparator.comparing(MedicineStock::getPrice))
                        .map(stock -> MedicineSearchResponse.PharmacyResult.builder()
                                .pharmacyId(stock.getPharmacy().getId())
                                .pharmacyName(stock.getPharmacy().getName())
                                .address(stock.getPharmacy().getAddressLine())
                                .city(stock.getPharmacy().getCity())
                                .price(stock.getPrice())
                                .quantity(stock.getQuantity())
                                .stockStatus(stock.getStockStatus().name())
                                .build())
                        .toList();

        return MedicineSearchResponse.builder()
                .id(medicine.getId())
                .name(medicine.getName())
                .genericName(medicine.getGenericName())
                .manufacturer(medicine.getManufacturer())
                .category(medicine.getCategory() == null ? null : medicine.getCategory().getName())
                .dosageForm(medicine.getDosageForm())
                .strength(medicine.getStrength())
                .requiresPrescription(medicine.isRequiresPrescription())
                .pharmacies(pharmacies)
                .build();
    }

    public record MedicineMatchResult(
            List<String> detectedNames,
            List<MedicineSearchResponse> matchedMedicines,
            List<String> unmatchedNames,
            String statusMessage
    ) {
        public MedicineMatchResult(List<String> detectedNames, List<MedicineSearchResponse> matchedMedicines) {
            this(detectedNames, matchedMedicines, Collections.emptyList(), null);
        }
    }
}
