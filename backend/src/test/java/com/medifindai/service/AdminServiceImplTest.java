package com.medifindai.service;

import com.medifindai.dto.admin.AdminDashboardStatsDto;
import com.medifindai.dto.admin.AdminPharmacyDto;
import com.medifindai.dto.admin.VerifyPharmacyRequest;
import com.medifindai.entity.*;
import com.medifindai.repository.*;
import com.medifindai.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PharmacyRepository pharmacyRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private MedicineCategoryRepository categoryRepository;

    @Mock
    private MedicineStockRepository stockRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ReservationStatusHistoryRepository reservationStatusHistoryRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private FavouritePharmacyRepository favouritePharmacyRepository;

    @Mock
    private PharmacyVerificationRepository pharmacyVerificationRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User sampleOwner;
    private Pharmacy samplePharmacy;

    @BeforeEach
    void setUp() {
        sampleOwner = User.builder()
                .id(10L)
                .fullName("Pharmacist John")
                .email("john@pharmacy.com")
                .phone("9876543210")
                .role(Role.PHARMACY_OWNER)
                .active(true)
                .build();

        samplePharmacy = Pharmacy.builder()
                .id(100L)
                .owner(sampleOwner)
                .name("HealthCare Plus Pharmacy")
                .licenseNumber("LIC-2026-99")
                .addressLine("Road 1")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500001")
                .phone("9876543210")
                .email("contact@healthcareplus.com")
                .verificationStatus(Pharmacy.VerificationStatus.PENDING)
                .active(true)
                .build();
    }

    @Test
    void testGetDashboardStats() {
        when(userRepository.count()).thenReturn(5L);
        when(userRepository.countByRole(Role.USER)).thenReturn(3L);
        when(userRepository.countByRole(Role.PHARMACY_OWNER)).thenReturn(1L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);
        when(pharmacyRepository.count()).thenReturn(2L);
        when(medicineRepository.count()).thenReturn(10L);
        when(stockRepository.count()).thenReturn(25L);
        when(reservationRepository.count()).thenReturn(8L);

        AdminDashboardStatsDto stats = adminService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(5L, stats.getTotalUsers());
        assertEquals(3L, stats.getTotalNormalUsers());
        assertEquals(2L, stats.getTotalPharmacies());
    }

    @Test
    void testGetPharmacies() {
        Pageable pageable = PageRequest.of(0, 10);
        when(pharmacyRepository.searchPharmaciesAdmin(eq(Pharmacy.VerificationStatus.PENDING), eq("HealthCare"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(samplePharmacy)));
        when(stockRepository.countByPharmacyId(100L)).thenReturn(5);

        Page<AdminPharmacyDto> result = adminService.getPharmacies(Pharmacy.VerificationStatus.PENDING, "HealthCare", pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("HealthCare Plus Pharmacy", result.getContent().get(0).getName());
        assertEquals("LIC-2026-99", result.getContent().get(0).getLicenseNumber());
    }

    @Test
    void testVerifyPharmacy_Approve() {
        VerifyPharmacyRequest request = new VerifyPharmacyRequest(Pharmacy.VerificationStatus.VERIFIED, "Approved by compliance team");
        when(pharmacyRepository.findById(100L)).thenReturn(Optional.of(samplePharmacy));
        when(pharmacyRepository.save(any(Pharmacy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminPharmacyDto result = adminService.verifyPharmacy(100L, request);

        assertNotNull(result);
        assertEquals("VERIFIED", result.getVerificationStatus());
        assertTrue(samplePharmacy.isActive());
        verify(notificationService).createNotification(eq(sampleOwner), contains("Approved"), anyString(), eq(Notification.Type.SYSTEM), eq(100L), anyString());
    }

    @Test
    void testDeletePharmacy_Success() {
        when(pharmacyRepository.findById(100L)).thenReturn(Optional.of(samplePharmacy));

        Reservation res = Reservation.builder().id(50L).pharmacy(samplePharmacy).build();
        when(reservationRepository.findByPharmacyIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(res));

        Order order = Order.builder().id(70L).pharmacy(samplePharmacy).build();
        when(orderRepository.findByPharmacyIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(order));

        adminService.deletePharmacy(100L);

        // Verify cascading cleanup
        verify(reservationStatusHistoryRepository).deleteByReservationId(50L);
        verify(reservationRepository).delete(res);
        verify(orderRepository).deleteAll(List.of(order));
        verify(stockRepository).deleteByPharmacyId(100L);
        verify(favouritePharmacyRepository).deleteByPharmacyId(100L);
        verify(pharmacyVerificationRepository).deleteByPharmacyId(100L);
        verify(pharmacyRepository).delete(samplePharmacy);
        verify(notificationService).createNotification(eq(sampleOwner), contains("Removed"), anyString(), eq(Notification.Type.SYSTEM), isNull(), anyString());
    }
}
