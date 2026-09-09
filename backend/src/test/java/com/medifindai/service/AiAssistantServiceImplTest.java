package com.medifindai.service;

import com.medifindai.dto.ai.AiChatRequest;
import com.medifindai.dto.ai.AiChatResponse;
import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.Pharmacy;
import com.medifindai.repository.AiChatLogRepository;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import com.medifindai.repository.PharmacyRepository;
import com.medifindai.repository.UserRepository;
import com.medifindai.service.ai.GeminiAiProvider;
import com.medifindai.service.ai.OpenAiProvider;
import com.medifindai.service.impl.AiAssistantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAssistantServiceImplTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private MedicineStockRepository medicineStockRepository;

    @Mock
    private PharmacyRepository pharmacyRepository;

    @Mock
    private AiChatLogRepository aiChatLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GeminiAiProvider geminiAiProvider;

    @Mock
    private OpenAiProvider openAiProvider;

    @InjectMocks
    private AiAssistantServiceImpl aiAssistantService;

    @BeforeEach
    void setup() {
        lenient().when(geminiAiProvider.isAvailable()).thenReturn(false);
        lenient().when(openAiProvider.isAvailable()).thenReturn(false);
    }

    @Test
    void test1_Greeting() {
        AiChatRequest req = AiChatRequest.builder().message("hi").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("greetings");
        assertThat(resp.getReply()).contains("MediFindAI Medical Assistant");
    }

    @Test
    void test2_Hello() {
        AiChatRequest req = AiChatRequest.builder().message("hello").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("greetings");
    }

    @Test
    void test3_FindParacetamol() {
        Medicine med = Medicine.builder().id(1L).name("Paracetamol 500mg").build();
        when(medicineRepository.searchByNameOrGeneric(eq("Paracetamol"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(med)));

        AiChatRequest req = AiChatRequest.builder().message("Find Paracetamol").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("medicine_search");
        assertThat(resp.getMedicineName()).isEqualTo("Paracetamol");
    }

    @Test
    void test4_WhatIsParacetamol() {
        AiChatRequest req = AiChatRequest.builder().message("What is Paracetamol?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isIn("medicine_information", "medicine_uses");
        assertThat(resp.getReply()).contains("Paracetamol");
        assertThat(resp.getReply()).contains("Pain Relief");
    }

    @Test
    void test5_WhatIsParacetamolUsedFor() {
        AiChatRequest req = AiChatRequest.builder().message("What is Paracetamol used for?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("medicine_uses");
        assertThat(resp.getReply()).contains("mild-to-moderate pain");
        assertThat(resp.getReply()).contains("fever");
    }

    @Test
    void test6_WhatAreTheSideEffectsOfParacetamol() {
        AiChatRequest req = AiChatRequest.builder().message("What are the side effects of Paracetamol?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("medicine_side_effects");
        assertThat(resp.getMedicineName()).isEqualTo("Paracetamol");
        assertThat(resp.getReply()).contains("Side Effects");
        assertThat(resp.getReply()).contains("liver damage");
        // Must NOT return generic search redirection!
        assertThat(resp.getReply()).doesNotContain("I can help you search for");
    }

    @Test
    void test7_CanITakeParacetamolWithoutPrescription() {
        AiChatRequest req = AiChatRequest.builder().message("Can I take Paracetamol without prescription?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("prescription_requirement");
        assertThat(resp.getReply()).contains("Over-the-Counter");
    }

    @Test
    void test8_WhichPharmacyHasParacetamolInStock() {
        Pharmacy p = Pharmacy.builder().id(10L).name("Apollo Care Pharmacy").city("Bangalore").active(true).build();
        Medicine m = Medicine.builder().id(1L).name("Paracetamol 500mg").build();
        MedicineStock s = MedicineStock.builder().id(100L).medicine(m).pharmacy(p).quantity(15).price(BigDecimal.valueOf(25.0)).build();

        when(medicineRepository.searchByNameOrGeneric(eq("Paracetamol"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(m)));
        when(medicineStockRepository.findByMedicineId(1L)).thenReturn(List.of(s));

        AiChatRequest req = AiChatRequest.builder().message("Which pharmacy has Paracetamol in stock?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("pharmacy_stock");
        assertThat(resp.getReply()).contains("Apollo Care Pharmacy");
        assertThat(resp.getReply()).contains("₹25.00");
    }

    @Test
    void test9_WhereCanIFindParacetamolNearMe() {
        Pharmacy p = Pharmacy.builder().id(10L).name("MedPlus Express").city("Hyderabad").addressLine("Kukatpally").phone("9876543210").active(true).build();
        when(pharmacyRepository.findByActiveTrueAndVerificationStatus(any())).thenReturn(List.of(p));

        AiChatRequest req = AiChatRequest.builder().message("Where can I find Paracetamol near me?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("nearby_pharmacies");
        assertThat(resp.getReply()).contains("MedPlus Express");
    }

    @Test
    void test10_CompareParacetamolPrices() {
        Pharmacy p1 = Pharmacy.builder().id(10L).name("Apollo Care").active(true).build();
        Pharmacy p2 = Pharmacy.builder().id(20L).name("MedPlus").active(true).build();
        Medicine m = Medicine.builder().id(1L).name("Paracetamol 500mg").build();
        MedicineStock s1 = MedicineStock.builder().medicine(m).pharmacy(p1).quantity(10).price(BigDecimal.valueOf(22.50)).build();
        MedicineStock s2 = MedicineStock.builder().medicine(m).pharmacy(p2).quantity(5).price(BigDecimal.valueOf(28.00)).build();

        when(medicineRepository.searchByNameOrGeneric(eq("Paracetamol"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(m)));
        when(medicineStockRepository.findByMedicineId(1L)).thenReturn(List.of(s1, s2));

        AiChatRequest req = AiChatRequest.builder().message("Compare Paracetamol prices").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("price_comparison");
        assertThat(resp.getReply()).contains("Price Comparison for Paracetamol 500mg");
        assertThat(resp.getReply()).contains("₹22.50");
    }

    @Test
    void test11_AlternativesToParacetamol() {
        AiChatRequest req = AiChatRequest.builder().message("What are alternatives to Paracetamol?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("medicine_alternatives");
        assertThat(resp.getReply()).contains("Ibuprofen");
    }

    @Test
    void test12_CanITakeParacetamolWithIbuprofen() {
        AiChatRequest req = AiChatRequest.builder().message("Can I take Paracetamol with Ibuprofen?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("drug_interactions");
        assertThat(resp.getReply()).contains("Ibuprofen");
    }

    @Test
    void test13_WhatIsAmoxicillinUsedFor() {
        AiChatRequest req = AiChatRequest.builder().message("What is Amoxicillin used for?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("medicine_uses");
        assertThat(resp.getReply()).contains("Penicillin Antibiotic");
        assertThat(resp.getReply()).contains("bacterial infections");
    }

    @Test
    void test14_SideEffectsOfAmoxicillin() {
        AiChatRequest req = AiChatRequest.builder().message("What are the side effects of Amoxicillin?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("medicine_side_effects");
        assertThat(resp.getReply()).contains("diarrhea");
        assertThat(resp.getReply()).contains("allergic");
    }

    @Test
    void test15_MedicineForHeadache() {
        AiChatRequest req = AiChatRequest.builder().message("I need medicine for a headache").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("symptoms_health");
        assertThat(resp.getReply()).contains("Paracetamol");
        assertThat(resp.getReply()).contains("Ibuprofen");
    }

    @Test
    void test16_DoctorGaveMeAPrescription() {
        AiChatRequest req = AiChatRequest.builder().message("My doctor gave me a prescription").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("prescription_help");
        assertThat(resp.getReply()).contains("Prescription OCR scanner");
    }

    @Test
    void test17_WhereCanIUploadMyPrescription() {
        AiChatRequest req = AiChatRequest.builder().message("Where can I upload my prescription?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("prescription_help");
        assertThat(resp.getReply()).contains("Prescription OCR scanner");
    }

    @Test
    void test18_ShowMyOrders() {
        AiChatRequest req = AiChatRequest.builder().message("Show my orders").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("order_help");
        assertThat(resp.getReply()).contains("Orders");
    }

    @Test
    void test19_ReserveAMedicine() {
        AiChatRequest req = AiChatRequest.builder().message("I want to reserve a medicine").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("reservation_help");
        assertThat(resp.getReply()).contains("24-Hour Medicine Pickup Holds");
    }

    @Test
    void test20_WhatPharmaciesAreNearby() {
        Pharmacy p = Pharmacy.builder().name("HealthFirst Pharmacy").city("Mumbai").active(true).build();
        when(pharmacyRepository.findByActiveTrueAndVerificationStatus(any())).thenReturn(List.of(p));

        AiChatRequest req = AiChatRequest.builder().message("What pharmacies are nearby?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo("nearby_pharmacies");
        assertThat(resp.getReply()).contains("HealthFirst Pharmacy");
    }

    @Test
    void testMultiTurnContextResolution() {
        // Step 1: User asks "What is paracetamol used for?"
        // Step 2: User asks "What are its side effects?" (resolving "its" -> Paracetamol)
        AiChatRequest.ChatMessageDto turn1User = new AiChatRequest.ChatMessageDto("user", "What is Paracetamol used for?");
        AiChatRequest.ChatMessageDto turn1Bot = new AiChatRequest.ChatMessageDto("assistant", "Paracetamol is used for pain relief.");

        AiChatRequest req2 = AiChatRequest.builder()
                .message("What are its side effects?")
                .history(List.of(turn1User, turn1Bot))
                .build();

        AiChatResponse resp2 = aiAssistantService.generateReply(req2);
        assertThat(resp2.getIntent()).isEqualTo("medicine_side_effects");
        assertThat(resp2.getMedicineName()).isEqualTo("Paracetamol");
        assertThat(resp2.getReply()).contains("Paracetamol");
        assertThat(resp2.getReply()).contains("liver damage");
    }
}
