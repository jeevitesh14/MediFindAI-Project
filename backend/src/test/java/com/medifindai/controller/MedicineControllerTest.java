package com.medifindai.controller;

import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineCategory;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.MedicineStock.StockStatus;
import com.medifindai.entity.Pharmacy;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicineControllerTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private MedicineStockRepository medicineStockRepository;

    @InjectMocks
    private MedicineController medicineController;

    private Medicine testMedicine;
    private MedicineStock testStock;
    private Pharmacy testPharmacy;

    @BeforeEach
    void setUp() {
        MedicineCategory category = new MedicineCategory();
        category.setId(1L);
        category.setName("Analgesics");

        testMedicine = Medicine.builder()
                .id(1L)
                .name("Paracetamol 500mg")
                .genericName("Paracetamol")
                .manufacturer("Cipla Ltd")
                .category(category)
                .dosageForm("Tablet")
                .strength("500mg")
                .requiresPrescription(false)
                .build();

        testPharmacy = Pharmacy.builder()
                .id(10L)
                .name("Apollo Care Pharmacy")
                .addressLine("Road 12")
                .city("Hyderabad")
                .active(true)
                .build();

        testStock = MedicineStock.builder()
                .id(100L)
                .medicine(testMedicine)
                .pharmacy(testPharmacy)
                .price(BigDecimal.valueOf(25.00))
                .quantity(150)
                .stockStatus(StockStatus.AVAILABLE)
                .build();
    }

    @Test
    void search_shouldReturnMatchingMedicinesWithStock() {
        when(medicineRepository.searchByNameOrGeneric(eq("par"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testMedicine)));
        when(medicineStockRepository.findByMedicineId(1L))
                .thenReturn(List.of(testStock));

        var response = medicineController.search("par");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).hasSize(1);
        assertThat(response.getData().get(0).getName()).isEqualTo("Paracetamol 500mg");
        assertThat(response.getData().get(0).getPharmacies()).hasSize(1);
        assertThat(response.getData().get(0).getPharmacies().get(0).getPharmacyName()).isEqualTo("Apollo Care Pharmacy");
    }

    @Test
    void suggestions_shouldReturnEmptyList_whenQueryUnderTwoChars() {
        var response = medicineController.suggestions("p", 10);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).isEmpty();
    }

    @Test
    void suggestions_shouldReturnSuggestions_whenQueryIsAtLeastTwoChars() {
        when(medicineRepository.searchByNameOrGeneric(eq("par"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testMedicine)));

        var response = medicineController.suggestions("par", 5);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).hasSize(1);
        assertThat(response.getData().get(0).getName()).isEqualTo("Paracetamol 500mg");
        assertThat(response.getData().get(0).getGenericName()).isEqualTo("Paracetamol");
        assertThat(response.getData().get(0).getStrength()).isEqualTo("500mg");
    }

    @Test
    void getByBarcode_shouldReturnMedicine_whenBarcodeExists() {
        testMedicine.setBarcode("8901088012345");
        when(medicineRepository.findByBarcode("8901088012345"))
                .thenReturn(java.util.Optional.of(testMedicine));

        var response = medicineController.getByBarcode("8901088012345");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getName()).isEqualTo("Paracetamol 500mg");
        assertThat(response.getData().getBarcode()).isEqualTo("8901088012345");
    }

    @Test
    void getByBarcode_shouldThrow_whenBarcodeNotFound() {
        when(medicineRepository.findByBarcode("9999999999999"))
                .thenReturn(java.util.Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> medicineController.getByBarcode("9999999999999"))
                .isInstanceOf(com.medifindai.exception.ResourceNotFoundException.class);
    }
}

