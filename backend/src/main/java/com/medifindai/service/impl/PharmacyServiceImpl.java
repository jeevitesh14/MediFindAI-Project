package com.medifindai.service.impl;

import com.medifindai.dto.pharmacy.NearbyPharmacyResponse;
import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.Pharmacy;
import com.medifindai.exception.BadRequestException;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import com.medifindai.repository.PharmacyRepository;
import com.medifindai.service.PharmacyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyServiceImpl implements PharmacyService {

    private static final double DEFAULT_RADIUS_KM = 10.0;
    private static final double MAX_RADIUS_KM = 50.0;
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final PharmacyRepository pharmacyRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository medicineStockRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NearbyPharmacyResponse> findNearbyPharmacies(
            Double latitude, Double longitude, Double radiusKm, Long medicineId) {

        validateCoordinates(latitude, longitude);

        double effectiveRadius = (radiusKm == null || radiusKm <= 0)
                ? DEFAULT_RADIUS_KM
                : Math.min(radiusKm, MAX_RADIUS_KM);

        Medicine selectedMedicine = null;
        if (medicineId != null) {
            selectedMedicine = medicineRepository.findById(medicineId)
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + medicineId));
        }

        List<Pharmacy> verifiedPharmacies = pharmacyRepository
                .findByActiveTrueAndVerificationStatus(Pharmacy.VerificationStatus.VERIFIED);

        final Medicine medicine = selectedMedicine;

        return verifiedPharmacies.stream()
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .map(pharmacy -> {
                    double distance = calculateDistanceKm(
                            latitude, longitude,
                            pharmacy.getLatitude(), pharmacy.getLongitude()
                    );
                    return toResponse(pharmacy, distance, medicine);
                })
                .filter(response -> response.getDistanceKm() <= effectiveRadius)
                .sorted(Comparator.comparingDouble(NearbyPharmacyResponse::getDistanceKm))
                .toList();
    }

    public static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;
        return Math.round(distance * 100.0) / 100.0;
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || latitude < -90.0 || latitude > 90.0) {
            throw new BadRequestException("Latitude must be between -90.0 and 90.0.");
        }
        if (longitude == null || longitude < -180.0 || longitude > 180.0) {
            throw new BadRequestException("Longitude must be between -180.0 and 180.0.");
        }
    }

    private boolean isPharmacyOpenNow(Pharmacy pharmacy) {
        if (pharmacy.is24Hours()) {
            return true;
        }
        if (pharmacy.getOpeningTime() == null || pharmacy.getClosingTime() == null) {
            return true; // Default to open if hours not configured
        }
        LocalTime now = LocalTime.now();
        LocalTime open = pharmacy.getOpeningTime();
        LocalTime close = pharmacy.getClosingTime();

        if (close.isAfter(open)) {
            return !now.isBefore(open) && !now.isAfter(close);
        } else {
            // Overnight operating hours (e.g. 8 PM to 4 AM)
            return !now.isBefore(open) || !now.isAfter(close);
        }
    }

    private NearbyPharmacyResponse toResponse(Pharmacy pharmacy, double distanceKm, Medicine medicine) {
        NearbyPharmacyResponse.NearbyPharmacyResponseBuilder builder = NearbyPharmacyResponse.builder()
                .id(pharmacy.getId())
                .name(pharmacy.getName())
                .description(pharmacy.getDescription())
                .licenseNumber(pharmacy.getLicenseNumber())
                .addressLine(pharmacy.getAddressLine())
                .city(pharmacy.getCity())
                .state(pharmacy.getState())
                .postalCode(pharmacy.getPostalCode())
                .phone(pharmacy.getPhone())
                .email(pharmacy.getEmail())
                .openingTime(pharmacy.getOpeningTime())
                .closingTime(pharmacy.getClosingTime())
                .is24Hours(pharmacy.is24Hours())
                .isOpenNow(isPharmacyOpenNow(pharmacy))
                .rating(pharmacy.getRating() != null ? pharmacy.getRating() : 0.0)
                .latitude(pharmacy.getLatitude())
                .longitude(pharmacy.getLongitude())
                .distanceKm(distanceKm);

        if (medicine != null) {
            builder.medicineId(medicine.getId());
            builder.medicineName(medicine.getName());

            Optional<MedicineStock> stockOpt = medicineStockRepository
                    .findByPharmacyIdAndMedicineId(pharmacy.getId(), medicine.getId());

            if (stockOpt.isPresent()) {
                MedicineStock stock = stockOpt.get();
                builder.price(stock.getPrice());
                builder.quantity(stock.getQuantity());
                builder.stockStatus(stock.getStockStatus() != null ? stock.getStockStatus().name() : "OUT_OF_STOCK");
            } else {
                builder.price(null);
                builder.quantity(0);
                builder.stockStatus("NOT_STOCKED");
            }
        }

        return builder.build();
    }
}
