package com.medifindai.service;

import com.medifindai.dto.ai.AiChatRequest;
import com.medifindai.dto.ai.AiChatResponse;
import com.medifindai.entity.Medicine;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import com.medifindai.service.impl.AiAssistantServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiAssistantServiceImplTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private MedicineStockRepository medicineStockRepository;

    @InjectMocks
    private AiAssistantServiceImpl aiAssistantService;

    @Test
    void generateReply_shouldBlockDosageAndDiagnosisQueries() {
        AiChatRequest request = AiChatRequest.builder()
                .message("What dose of Paracetamol should I take for high fever?")
                .build();

        AiChatResponse response = aiAssistantService.generateReply(request);

        assertThat(response.getReply()).contains("cannot provide medical diagnoses, treatment plans, or dosage recommendations");
        assertThat(response.getDisclaimer()).isEqualTo(AiAssistantServiceImpl.SAFETY_DISCLAIMER);
    }

    @Test
    void generateReply_shouldExplainPrescriptionRequirements() {
        AiChatRequest request = AiChatRequest.builder()
                .message("Do I need a prescription?")
                .build();

        AiChatResponse response = aiAssistantService.generateReply(request);

        assertThat(response.getReply()).contains("Prescription required");
        assertThat(response.getDisclaimer()).isEqualTo(AiAssistantServiceImpl.SAFETY_DISCLAIMER);
    }

    @Test
    void generateReply_shouldLookupMedicineSafely() {
        Medicine med = Medicine.builder()
                .id(1L)
                .name("Paracetamol 500mg")
                .genericName("Paracetamol")
                .dosageForm("Tablet")
                .strength("500mg")
                .requiresPrescription(false)
                .build();

        when(medicineRepository.searchByNameOrGeneric(eq("paracetamol"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(med)));
        when(medicineStockRepository.findByMedicineId(1L))
                .thenReturn(Collections.emptyList());

        AiChatRequest request = AiChatRequest.builder()
                .message("Find Paracetamol")
                .build();

        AiChatResponse response = aiAssistantService.generateReply(request);

        assertThat(response.getReply()).contains("Paracetamol 500mg");
        assertThat(response.getDisclaimer()).isEqualTo(AiAssistantServiceImpl.SAFETY_DISCLAIMER);
    }
}
