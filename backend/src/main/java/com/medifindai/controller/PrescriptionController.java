package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.prescription.PrescriptionScanResponse;
import com.medifindai.dto.prescription.PrescriptionSummaryDto;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.PrescriptionOcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionOcrService prescriptionOcrService;

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PrescriptionScanResponse>> scanPrescription(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {

        PrescriptionScanResponse response = prescriptionOcrService.scanAndProcess(principal.getId(), file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Prescription scanned successfully.", response));
    }

    @GetMapping("/my")
    public ApiResponse<List<PrescriptionSummaryDto>> getMyPrescriptions(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<PrescriptionSummaryDto> list = prescriptionOcrService.getUserPrescriptions(principal.getId());
        return ApiResponse.success(list);
    }

    @GetMapping("/{id}")
    public ApiResponse<PrescriptionScanResponse> getPrescriptionById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        PrescriptionScanResponse response = prescriptionOcrService.getPrescriptionById(principal.getId(), id);
        return ApiResponse.success(response);
    }
}
