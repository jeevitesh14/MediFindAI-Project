package com.medifindai.service;

import com.medifindai.dto.ai.AiChatRequest;
import com.medifindai.dto.ai.AiChatResponse;
import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.Pharmacy;
import com.medifindai.repository.AiChatLogRepository;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import com.medifindai.repository.OrderRepository;
import com.medifindai.repository.PharmacyRepository;
import com.medifindai.repository.ReservationRepository;
import com.medifindai.repository.UserRepository;
import com.medifindai.service.ai.GeminiAiProvider;
import com.medifindai.service.ai.MedicalIntent;
import com.medifindai.service.ai.OpenAiProvider;
import com.medifindai.service.impl.AiAssistantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
    private OrderRepository orderRepository;

    @Mock
    private ReservationRepository reservationRepository;

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
    @DisplayName("General conversation greeting responds in chat without navigation")
    void test1_Greeting() {
        AiChatRequest req = AiChatRequest.builder().message("hi").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.GENERAL_CONVERSATION.getValue());
        assertThat(resp.getReply()).contains("MediFindAI Healthcare Assistant");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("What is Paracetamol used for? answers inside chat without navigation")
    void test2_WhatIsParacetamolUsedFor() {
        AiChatRequest req = AiChatRequest.builder().message("What is Paracetamol used for?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.MEDICAL_INFORMATION.getValue());
        assertThat(resp.getReply()).contains("Paracetamol");
        assertThat(resp.getReply()).contains("mild-to-moderate pain");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("What are the side effects of Amoxicillin? answers inside chat without navigation")
    void test3_WhatAreSideEffectsOfAmoxicillin() {
        AiChatRequest req = AiChatRequest.builder().message("What are the side effects of Amoxicillin?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.MEDICAL_INFORMATION.getValue());
        assertThat(resp.getReply()).contains("Amoxicillin");
        assertThat(resp.getReply()).contains("diarrhea");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("Find Paracetamol suggestion queries DB and responds in chat without redirecting")
    void test4_FindParacetamol() {
        com.medifindai.entity.MedicineCategory cat = com.medifindai.entity.MedicineCategory.builder().id(1L).name("Analgesic").build();
        Medicine med = Medicine.builder().id(1L).name("Paracetamol 500mg").category(cat).build();
        when(medicineRepository.searchByNameOrGeneric(eq("Paracetamol"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(med)));

        AiChatRequest req = AiChatRequest.builder().message("Find Paracetamol").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.MEDICINE_SEARCH.getValue());
        assertThat(resp.getMedicineName()).isEqualTo("Paracetamol");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("Which pharmacies have Paracetamol in stock? returns live stock data and pharmacy cards")
    void test5_WhichPharmaciesHaveParacetamolInStock() {
        Pharmacy p = Pharmacy.builder().id(10L).name("Apollo Care Pharmacy").city("Bangalore").active(true).build();
        Medicine m = Medicine.builder().id(1L).name("Paracetamol 500mg").build();
        MedicineStock s = MedicineStock.builder().id(100L).medicine(m).pharmacy(p).quantity(15).price(BigDecimal.valueOf(25.0)).build();

        when(medicineRepository.searchByNameOrGeneric(eq("Paracetamol"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(m)));
        when(medicineStockRepository.findByMedicineId(1L)).thenReturn(List.of(s));

        AiChatRequest req = AiChatRequest.builder().message("Which pharmacies have Paracetamol in stock?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.PRICE_AVAILABILITY.getValue());
        assertThat(resp.getReply()).contains("Apollo Care Pharmacy");
        assertThat(resp.getReply()).contains("₹25.00");
        assertThat(resp.getPharmacyCards()).isNotEmpty();
        assertThat(resp.getPharmacyCards().get(0).getName()).isEqualTo("Apollo Care Pharmacy");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("What is the price of Paracetamol? returns price information in chat")
    void test6_WhatIsPriceOfParacetamol() {
        Pharmacy p = Pharmacy.builder().id(10L).name("Apollo Care Pharmacy").city("Bangalore").active(true).build();
        Medicine m = Medicine.builder().id(1L).name("Paracetamol 500mg").build();
        MedicineStock s = MedicineStock.builder().id(100L).medicine(m).pharmacy(p).quantity(20).price(BigDecimal.valueOf(22.50)).build();

        when(medicineRepository.searchByNameOrGeneric(eq("Paracetamol"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(m)));
        when(medicineStockRepository.findByMedicineId(1L)).thenReturn(List.of(s));

        AiChatRequest req = AiChatRequest.builder().message("What is the price of Paracetamol?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.PRICE_AVAILABILITY.getValue());
        assertThat(resp.getReply()).contains("₹22.50");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("How do I reserve a medicine? explains pickup hold process without navigating")
    void test7_HowDoIReserveMedicine() {
        AiChatRequest req = AiChatRequest.builder().message("How do I reserve a medicine?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.RESERVATION_HELP.getValue());
        assertThat(resp.getReply()).contains("24-Hour Guaranteed Medicine Pickup Holds");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("How can I upload a prescription? explains OCR process without automatic navigation")
    void test8_HowCanIUploadPrescription() {
        AiChatRequest req = AiChatRequest.builder().message("How can I upload a prescription?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.PRESCRIPTION_HELP.getValue());
        assertThat(resp.getReply()).contains("intelligent AI Prescription Scanner");
        assertThat(resp.getNavigation()).isNull();
        // Separate action button provided
        assertThat(resp.getActions()).anyMatch(a -> a.getLabel().contains("Open Prescription Upload"));
    }

    @Test
    @DisplayName("Find pharmacies near Hyderabad searches pharmacy data and displays in chat")
    void test9_FindPharmaciesNearHyderabad() {
        Pharmacy p = Pharmacy.builder().id(10L).name("MedPlus Express").city("Hyderabad").addressLine("Kukatpally").phone("9876543210").active(true).build();
        when(pharmacyRepository.findByActiveTrueAndVerificationStatus(any())).thenReturn(List.of(p));

        AiChatRequest req = AiChatRequest.builder().message("Find pharmacies near Hyderabad").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.PHARMACY_SEARCH.getValue());
        assertThat(resp.getReply()).contains("MedPlus Express");
        assertThat(resp.getPharmacyCards()).isNotEmpty();
        assertThat(resp.getPharmacyCards().get(0).getName()).isEqualTo("MedPlus Express");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("Open the medicine search page returns explicit navigation directive")
    void test10_ExplicitNavigation_MedicineSearch() {
        AiChatRequest req = AiChatRequest.builder().message("Open the medicine search page").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.APP_NAVIGATION.getValue());
        assertThat(resp.getNavigation()).isNotNull();
        assertThat(resp.getNavigation().getTargetRoute()).isEqualTo("/dashboard/search");
        assertThat(resp.getNavigation().getDestinationName()).isEqualTo("Medicine Search");
        assertThat(resp.getNavigation().isRequiresAuth()).isFalse();
    }

    @Test
    @DisplayName("Take me to nearby pharmacies returns explicit navigation directive")
    void test11_ExplicitNavigation_NearbyPharmacies() {
        AiChatRequest req = AiChatRequest.builder().message("Take me to nearby pharmacies").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.APP_NAVIGATION.getValue());
        assertThat(resp.getNavigation()).isNotNull();
        assertThat(resp.getNavigation().getTargetRoute()).isEqualTo("/dashboard/pharmacies");
        assertThat(resp.getNavigation().getDestinationName()).isEqualTo("Nearby Pharmacies");
    }

    @Test
    @DisplayName("Open my reservations returns explicit navigation directive requiring auth")
    void test12_ExplicitNavigation_MyReservations() {
        AiChatRequest req = AiChatRequest.builder().message("Open my reservations").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.APP_NAVIGATION.getValue());
        assertThat(resp.getNavigation()).isNotNull();
        assertThat(resp.getNavigation().getTargetRoute()).isEqualTo("/dashboard/reservations");
        assertThat(resp.getNavigation().isRequiresAuth()).isTrue();
    }

    @Test
    @DisplayName("Go to my orders returns explicit navigation directive requiring auth")
    void test13_ExplicitNavigation_MyOrders() {
        AiChatRequest req = AiChatRequest.builder().message("Go to my orders").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.APP_NAVIGATION.getValue());
        assertThat(resp.getNavigation()).isNotNull();
        assertThat(resp.getNavigation().getTargetRoute()).isEqualTo("/dashboard/orders");
        assertThat(resp.getNavigation().isRequiresAuth()).isTrue();
    }

    @Test
    @DisplayName("Ambiguous single word query triggers CLARIFICATION_REQUIRED")
    void test14_AmbiguousQuery_ClarificationRequired() {
        AiChatRequest req = AiChatRequest.builder().message("medicine").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.CLARIFICATION_REQUIRED.getValue());
        assertThat(resp.getReply()).contains("Could you please specify");
        assertThat(resp.getNavigation()).isNull();
    }

    @Test
    @DisplayName("Multi-turn context resolution resolves pronoun 'its' to previous medicine")
    void test15_MultiTurnContextResolution() {
        AiChatRequest.ChatMessageDto turn1User = new AiChatRequest.ChatMessageDto("user", "What is Paracetamol used for?");
        AiChatRequest.ChatMessageDto turn1Bot = new AiChatRequest.ChatMessageDto("assistant", "Paracetamol is used for pain relief.");

        AiChatRequest req2 = AiChatRequest.builder()
                .message("What are its side effects?")
                .history(List.of(turn1User, turn1Bot))
                .build();

        AiChatResponse resp2 = aiAssistantService.generateReply(req2);
        assertThat(resp2.getIntent()).isEqualTo(MedicalIntent.MEDICAL_INFORMATION.getValue());
        assertThat(resp2.getMedicineName()).isEqualTo("Paracetamol");
        assertThat(resp2.getReply()).contains("Paracetamol");
        assertThat(resp2.getReply()).contains("liver damage");
    }

    @Test
    @DisplayName("Can I take Paracetamol without prescription? explains OTC status in chat")
    void test16_CanITakeParacetamolWithoutPrescription() {
        AiChatRequest req = AiChatRequest.builder().message("Can I take Paracetamol without prescription?").build();
        AiChatResponse resp = aiAssistantService.generateReply(req);
        assertThat(resp.getIntent()).isEqualTo(MedicalIntent.PRESCRIPTION_HELP.getValue());
        assertThat(resp.getReply()).contains("Over-the-Counter (OTC)");
        assertThat(resp.getNavigation()).isNull();
    }
}
