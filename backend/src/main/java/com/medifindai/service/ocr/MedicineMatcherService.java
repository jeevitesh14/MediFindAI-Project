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

    /**
     * Conservatively matches medicine entities from raw OCR text against the database.
     */
    @Transactional(readOnly = true)
    public MedicineMatchResult matchMedicinesFromText(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new MedicineMatchResult(Collections.emptyList(), Collections.emptyList());
        }

        String normalizedText = rawText.toLowerCase();
        Map<Long, Medicine> matchedMedicineMap = new LinkedHashMap<>();
        Set<String> detectedNames = new LinkedHashSet<>();

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

        // 2. Token-based fallback: extract words and search database
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

        // 3. Build response with live pharmacy prices and stock
        List<MedicineSearchResponse> searchResponses = matchedMedicineMap.values().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new MedicineMatchResult(new ArrayList<>(detectedNames), searchResponses);
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
            List<MedicineSearchResponse> matchedMedicines
    ) {}
}
