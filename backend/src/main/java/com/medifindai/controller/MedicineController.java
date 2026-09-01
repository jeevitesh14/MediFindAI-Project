package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.medicine.MedicineSearchResponse;
import com.medifindai.dto.medicine.MedicineSuggestionDto;
import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private static final int MAX_QUERY_LENGTH = 100;
    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository medicineStockRepository;

    @GetMapping("/search")
    @Transactional(readOnly = true)
    public ApiResponse<List<MedicineSearchResponse>> search(
            @RequestParam(defaultValue = "") String q) {

        String query = sanitizeQuery(q);

        List<Medicine> medicines = query.isBlank()
                ? medicineRepository.findAll(Sort.by("name"))
                : medicineRepository.searchByNameOrGeneric(query, Pageable.unpaged()).getContent();

        List<MedicineSearchResponse> results = medicines.stream()
                .map(this::toResponse)
                .toList();

        return ApiResponse.success(results);
    }

    @GetMapping("/suggestions")
    @Transactional(readOnly = true)
    public ApiResponse<List<MedicineSuggestionDto>> suggestions(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "10") int limit) {

        String query = sanitizeQuery(q);
        if (query.length() < 2) {
            return ApiResponse.success(Collections.emptyList());
        }

        int cappedLimit = Math.max(1, Math.min(limit, 20));
        Pageable pageable = PageRequest.of(0, cappedLimit, Sort.by("name").ascending());

        List<MedicineSuggestionDto> suggestions = medicineRepository
                .searchByNameOrGeneric(query, pageable)
                .getContent()
                .stream()
                .map(this::toSuggestionDto)
                .toList();

        return ApiResponse.success(suggestions);
    }

    @GetMapping("/barcode/{barcode}")
    @Transactional(readOnly = true)
    public ApiResponse<MedicineSuggestionDto> getByBarcode(@org.springframework.web.bind.annotation.PathVariable String barcode) {
        String sanitized = sanitizeQuery(barcode);
        Medicine medicine = medicineRepository.findByBarcode(sanitized)
                .orElseThrow(() -> new com.medifindai.exception.ResourceNotFoundException("Medicine not found in database for barcode: " + sanitized));

        return ApiResponse.success(toSuggestionDto(medicine));
    }

    private String sanitizeQuery(String input) {
        if (input == null) {
            return "";
        }
        String trimmed = input.trim();
        if (trimmed.length() > MAX_QUERY_LENGTH) {
            return trimmed.substring(0, MAX_QUERY_LENGTH);
        }
        return trimmed;
    }

    private MedicineSuggestionDto toSuggestionDto(Medicine medicine) {
        return MedicineSuggestionDto.builder()
                .id(medicine.getId())
                .name(medicine.getName())
                .genericName(medicine.getGenericName())
                .manufacturer(medicine.getManufacturer())
                .dosageForm(medicine.getDosageForm())
                .strength(medicine.getStrength())
                .category(medicine.getCategory() == null ? null : medicine.getCategory().getName())
                .requiresPrescription(medicine.isRequiresPrescription())
                .barcode(medicine.getBarcode())
                .build();
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
}