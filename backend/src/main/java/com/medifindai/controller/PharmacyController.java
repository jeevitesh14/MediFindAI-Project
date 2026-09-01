package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.pharmacy.NearbyPharmacyResponse;
import com.medifindai.service.PharmacyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/pharmacies")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyService pharmacyService;

    @GetMapping("/nearby")
    public ApiResponse<List<NearbyPharmacyResponse>> getNearbyPharmacies(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10.0") Double radiusKm,
            @RequestParam(required = false) Long medicineId) {

        List<NearbyPharmacyResponse> results = pharmacyService.findNearbyPharmacies(
                latitude, longitude, radiusKm, medicineId);

        return ApiResponse.success(results);
    }
}
