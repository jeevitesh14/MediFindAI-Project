package com.medifindai.service;

import com.medifindai.dto.pharmacy.NearbyPharmacyResponse;
import com.medifindai.entity.Medicine;
import com.medifindai.entity.MedicineStock;
import com.medifindai.entity.Pharmacy;
import com.medifindai.exception.BadRequestException;
import com.medifindai.repository.MedicineRepository;
import com.medifindai.repository.MedicineStockRepository;
import com.medifindai.repository.PharmacyRepository;
import com.medifindai.service.impl.PharmacyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyServiceImplTest {

    @Mock private PharmacyRepository pharmacyRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private MedicineStockRepository medicineStockRepository;

    @InjectMocks
    private PharmacyServiceImpl pharmacyService;

    private Pharmacy pharmacy1; // ~1.5 km away from (17.3850, 78.4867)
    private Pharmacy pharmacy2; // ~6.0 km away from (17.3850, 78.4867)
    private Pharmacy pharmacy3; // ~25.0 km away from (17.3850, 78.4867)

    @BeforeEach
    void setUp() {
        pharmacy1 = Pharmacy.builder()
                .id(1L)
                .name("Apollo Care Pharmacy")
                .addressLine("Abids Road")
                .city("Hyderabad")
                .latitude(17.3950)
                .longitude(78.4750)
                .phone("+91 9876543210")
                .active(true)
                .verificationStatus(Pharmacy.VerificationStatus.VERIFIED)
                .is24Hours(true)
                .rating(4.8)
                .build();

        pharmacy2 = Pharmacy.builder()
                .id(2L)
                .name("MedPlus Jubilee Hills")
                .addressLine("Road No 36")
                .city("Hyderabad")
                .latitude(17.4100)
                .longitude(78.4500)
                .phone("+91 9876543211")
                .active(true)
                .verificationStatus(Pharmacy.VerificationStatus.VERIFIED)
                .openingTime(LocalTime.of(8, 0))
                .closingTime(LocalTime.of(23, 0))
                .rating(4.5)
                .build();

        pharmacy3 = Pharmacy.builder()
                .id(3L)
                .name("Suburban Pharmacy")
                .addressLine("Outer Ring Road")
                .city("Hyderabad")
                .latitude(17.6000)
                .longitude(78.5000)
                .phone("+91 9876543212")
                .active(true)
                .verificationStatus(Pharmacy.VerificationStatus.VERIFIED)
                .rating(4.0)
                .build();
    }

    @Test
    void findNearbyPharmacies_shouldReturnSortedPharmacies_withinDefaultRadius() {
        when(pharmacyRepository.findByActiveTrueAndVerificationStatus(Pharmacy.VerificationStatus.VERIFIED))
                .thenReturn(List.of(pharmacy3, pharmacy1, pharmacy2));

        // User at Hyderabad Central (17.3850, 78.4867), default 10 km radius
        List<NearbyPharmacyResponse> results = pharmacyService.findNearbyPharmacies(
                17.3850, 78.4867, 10.0, null
        );

        // pharmacy3 is ~24 km away, so only pharmacy1 and pharmacy2 should be returned
        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo(1L);
        assertThat(results.get(0).getName()).isEqualTo("Apollo Care Pharmacy");
        assertThat(results.get(0).getDistanceKm()).isLessThan(results.get(1).getDistanceKm());
        assertThat(results.get(0).is24Hours()).isTrue();
        assertThat(results.get(0).isOpenNow()).isTrue();
    }

    @Test
    void findNearbyPharmacies_shouldIncludeMedicineStock_whenMedicineIdProvided() {
        Medicine medicine = Medicine.builder()
                .id(100L)
                .name("Paracetamol 500mg")
                .build();

        MedicineStock stock1 = MedicineStock.builder()
                .id(10L)
                .pharmacy(pharmacy1)
                .medicine(medicine)
                .price(new BigDecimal("25.00"))
                .quantity(50)
                .stockStatus(MedicineStock.StockStatus.AVAILABLE)
                .build();

        when(medicineRepository.findById(100L)).thenReturn(Optional.of(medicine));
        when(pharmacyRepository.findByActiveTrueAndVerificationStatus(Pharmacy.VerificationStatus.VERIFIED))
                .thenReturn(List.of(pharmacy1));
        when(medicineStockRepository.findByPharmacyIdAndMedicineId(1L, 100L))
                .thenReturn(Optional.of(stock1));

        List<NearbyPharmacyResponse> results = pharmacyService.findNearbyPharmacies(
                17.3850, 78.4867, 10.0, 100L
        );

        assertThat(results).hasSize(1);
        NearbyPharmacyResponse r = results.get(0);
        assertThat(r.getMedicineId()).isEqualTo(100L);
        assertThat(r.getMedicineName()).isEqualTo("Paracetamol 500mg");
        assertThat(r.getPrice()).isEqualByComparingTo("25.00");
        assertThat(r.getQuantity()).isEqualTo(50);
        assertThat(r.getStockStatus()).isEqualTo("AVAILABLE");
    }

    @Test
    void findNearbyPharmacies_shouldThrow_whenCoordinatesAreInvalid() {
        // Invalid latitude > 90
        assertThatThrownBy(() -> pharmacyService.findNearbyPharmacies(95.0, 78.4867, 10.0, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Latitude must be between -90.0 and 90.0");

        // Invalid longitude < -180
        assertThatThrownBy(() -> pharmacyService.findNearbyPharmacies(17.3850, -190.0, 10.0, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Longitude must be between -180.0 and 180.0");
    }

    @Test
    void calculateDistanceKm_shouldComputeAccurateHaversineDistance() {
        // Distance between Mumbai (19.0760, 72.8777) and Pune (18.5204, 73.8567) is ~120 km
        double distance = PharmacyServiceImpl.calculateDistanceKm(19.0760, 72.8777, 18.5204, 73.8567);
        assertThat(distance).isBetween(115.0, 125.0);
    }
}
