package com.medifindai.service;

import com.medifindai.dto.admin.*;
import com.medifindai.exception.DuplicateResourceException;
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
        when(pharmacyRepository.searchPharmaciesAdmin(eq(Pharmacy.VerificationStatus.PENDING), isNull(), eq("HealthCare"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(samplePharmacy)));
        when(stockRepository.countByPharmacyId(100L)).thenReturn(5);

        Page<AdminPharmacyDto> result = adminService.getPharmacies(Pharmacy.VerificationStatus.PENDING, null, "HealthCare", pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("HealthCare Plus Pharmacy", result.getContent().get(0).getName());
        assertEquals("LIC-2026-99", result.getContent().get(0).getLicenseNumber());
    }

    @Test
    void testCreatePharmacy_Success() {
        CreatePharmacyAdminRequest req = CreatePharmacyAdminRequest.builder()
                .name("New Apollo Pharmacy")
                .licenseNumber("LIC-NEW-001")
                .ownerId(10L)
                .addressLine("Road 2")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500001")
                .latitude(17.3850)
                .longitude(78.4867)
                .phone("9876543210")
                .email("apollo.new@example.com")
                .active(true)
                .build();

        when(pharmacyRepository.existsByLicenseNumber("LIC-NEW-001")).thenReturn(false);
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleOwner));
        when(pharmacyRepository.save(any(Pharmacy.class))).thenAnswer(i -> {
            Pharmacy p = i.getArgument(0);
            p.setId(200L);
            return p;
        });

        AdminPharmacyDto created = adminService.createPharmacy(req);

        assertNotNull(created);
        assertEquals("New Apollo Pharmacy", created.getName());
        assertEquals("LIC-NEW-001", created.getLicenseNumber());
    }

    @Test
    void testCreatePharmacy_WithoutOwner_Success() {
        CreatePharmacyAdminRequest req = CreatePharmacyAdminRequest.builder()
                .name("Unassigned Apollo Pharmacy")
                .licenseNumber("LIC-UNASSIGNED-001")
                .ownerId(null)
                .addressLine("Road 5")
                .city("Hyderabad")
                .state("Telangana")
                .postalCode("500001")
                .latitude(17.3850)
                .longitude(78.4867)
                .phone("9876543210")
                .email("apollo.unassigned@example.com")
                .active(true)
                .build();

        when(pharmacyRepository.existsByLicenseNumber("LIC-UNASSIGNED-001")).thenReturn(false);
        when(pharmacyRepository.save(any(Pharmacy.class))).thenAnswer(i -> {
            Pharmacy p = i.getArgument(0);
            p.setId(201L);
            return p;
        });

        AdminPharmacyDto created = adminService.createPharmacy(req);

        assertNotNull(created);
        assertEquals("Unassigned Apollo Pharmacy", created.getName());
        assertEquals("LIC-UNASSIGNED-001", created.getLicenseNumber());
        assertNull(created.getOwnerId());
        assertNull(created.getOwnerName());
    }

    @Test
    void testCreatePharmacy_DuplicateLicense_ThrowsException() {
        CreatePharmacyAdminRequest req = CreatePharmacyAdminRequest.builder()
                .name("Duplicate Pharmacy")
                .licenseNumber("LIC-2026-99")
                .ownerId(10L)
                .addressLine("Road 1")
                .city("Hyderabad")
                .state("Telangana")
                .phone("9876543210")
                .latitude(17.3850)
                .longitude(78.4867)
                .build();

        when(pharmacyRepository.existsByLicenseNumber("LIC-2026-99")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> adminService.createPharmacy(req));
    }

    @Test
    void testTogglePharmacyActive() {
        when(pharmacyRepository.findById(100L)).thenReturn(Optional.of(samplePharmacy));
        when(pharmacyRepository.save(any(Pharmacy.class))).thenAnswer(i -> i.getArgument(0));

        AdminPharmacyDto toggled = adminService.togglePharmacyActive(100L, false);

        assertNotNull(toggled);
        assertFalse(toggled.isActive());
    }

    @Test
    void testAssignPharmacyOwner() {
        User newOwner = User.builder().id(20L).email("newowner@example.com").role(Role.USER).build();
        when(pharmacyRepository.findById(100L)).thenReturn(Optional.of(samplePharmacy));
        when(userRepository.findById(20L)).thenReturn(Optional.of(newOwner));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(pharmacyRepository.save(any(Pharmacy.class))).thenAnswer(i -> i.getArgument(0));

        AdminPharmacyDto result = adminService.assignPharmacyOwner(100L, 20L);

        assertNotNull(result);
        assertEquals(20L, result.getOwnerId());
        assertEquals(Role.PHARMACY_OWNER, newOwner.getRole());
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
