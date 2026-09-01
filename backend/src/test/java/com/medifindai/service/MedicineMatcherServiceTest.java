package com.medifindai.service;

import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.Pharmacy;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import com.medifindai.service.ocr.MedicineMatcherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicineMatcherServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private MedicineStockRepository medicineStockRepository;

    @InjectMocks
    private MedicineMatcherService medicineMatcherService;

    private Medicine paracetamol;
    private Medicine amoxicillin;

    @BeforeEach
    void setUp() {
        paracetamol = Medicine.builder()
                .id(1L)
                .name("Paracetamol 500mg")
                .genericName("Paracetamol")
                .dosageForm("Tablet")
                .strength("500mg")
                .requiresPrescription(false)
                .build();

        amoxicillin = Medicine.builder()
                .id(2L)
                .name("Amoxicillin 500mg")
                .genericName("Amoxicillin")
                .dosageForm("Capsule")
                .strength("500mg")
                .requiresPrescription(true)
                .build();
    }

    @Test
    void matchMedicinesFromText_shouldMatchKnownMedicinesInText() {
        when(medicineRepository.findAll()).thenReturn(List.of(paracetamol, amoxicillin));

        Pharmacy pharmacy = Pharmacy.builder()
                .id(10L)
                .name("Apollo Care Pharmacy")
                .addressLine("Road 12")
                .city("Hyderabad")
                .active(true)
                .build();

        MedicineStock stock = MedicineStock.builder()
                .id(100L)
                .medicine(paracetamol)
                .pharmacy(pharmacy)
                .price(BigDecimal.valueOf(25.0))
                .quantity(50)
                .stockStatus(MedicineStock.StockStatus.AVAILABLE)
                .build();

        when(medicineStockRepository.findByMedicineId(1L)).thenReturn(List.of(stock));

        String prescriptionText = "Dr. Rao Clinic\nDate: 2026-08-30\nRx\nParacetamol 500mg 1 tab OD after food for 3 days.\nTake with water.";

        MedicineMatcherService.MedicineMatchResult result =
                medicineMatcherService.matchMedicinesFromText(prescriptionText);

        assertThat(result.detectedNames()).contains("Paracetamol 500mg");
        assertThat(result.matchedMedicines()).hasSize(1);
        assertThat(result.matchedMedicines().get(0).getName()).isEqualTo("Paracetamol 500mg");
        assertThat(result.matchedMedicines().get(0).getPharmacies()).hasSize(1);
    }

    @Test
    void matchMedicinesFromText_withEmptyText_shouldReturnEmpty() {
        MedicineMatcherService.MedicineMatchResult result =
                medicineMatcherService.matchMedicinesFromText("");

        assertThat(result.detectedNames()).isEmpty();
        assertThat(result.matchedMedicines()).isEmpty();
    }
}
