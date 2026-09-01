package com.medifindai.service;

import com.medifindai.dto.pharmacy.NearbyPharmacyResponse;

import java.util.List;

public interface PharmacyService {

    List<NearbyPharmacyResponse> findNearbyPharmacies(Double latitude, Double longitude, Double radiusKm, Long medicineId);
}
