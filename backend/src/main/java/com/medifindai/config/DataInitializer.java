package com.medifindai.config;

import com.medifindai.entity.*;
import com.medifindai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicineCategoryRepository categoryRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository stockRepository;
    private final ReservationRepository reservationRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            seedUsersAndPharmacies();
            seedMedicinesAndStock();
            seedSampleNotifications();
        } catch (Exception e) {
            log.warn("Database initialization check completed: {}", e.getMessage());
        }
    }

    private void seedUsersAndPharmacies() {
        log.info("Ensuring essential development/admin accounts and default pharmacy exist...");

        // 1. Admin
        User admin = userRepository.findByEmail("admin@medifindai.com").orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .fullName("System Admin")
                    .email("admin@medifindai.com")
                    .phone("9000000001")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .active(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(admin);
            log.info("Provisioned default admin: admin@medifindai.com / admin123");
        } else {
            // Ensure admin role, active state, and password are valid
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            admin.setEmailVerified(true);
            userRepository.save(admin);
            log.info("Verified & updated admin credentials: admin@medifindai.com / admin123");
        }

        // 2. Regular User
        User user = userRepository.findByEmail("ravi.kumar@example.com").orElse(null);
        if (user == null) {
            user = User.builder()
                    .fullName("Ravi Kumar")
                    .email("ravi.kumar@example.com")
                    .phone("9000000002")
                    .passwordHash(passwordEncoder.encode("user123"))
                    .role(Role.USER)
                    .active(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(user);
        } else {
            user.setPasswordHash(passwordEncoder.encode("user123"));
            user.setRole(Role.USER);
            user.setActive(true);
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        // 3. Pharmacy Owner
        User owner = userRepository.findByEmail("suresh.pharmacy@example.com").orElse(null);
        if (owner == null) {
            owner = User.builder()
                    .fullName("Suresh Reddy")
                    .email("suresh.pharmacy@example.com")
                    .phone("9000000004")
                    .passwordHash(passwordEncoder.encode("pharmacy123"))
                    .role(Role.PHARMACY_OWNER)
                    .active(true)
                    .emailVerified(true)
                    .build();
            owner = userRepository.save(owner);
        } else {
            owner.setPasswordHash(passwordEncoder.encode("pharmacy123"));
            owner.setRole(Role.PHARMACY_OWNER);
            owner.setActive(true);
            owner.setEmailVerified(true);
            owner = userRepository.save(owner);
        }

        // Pharmacy for Suresh Reddy
        List<Pharmacy> existingPharmacies = pharmacyRepository.findByOwnerId(owner.getId());
        if (existingPharmacies.isEmpty()) {
            Pharmacy pharmacy = Pharmacy.builder()
                    .owner(owner)
                    .name("Apollo Care Pharmacy")
                    .licenseNumber("LIC-TS-10023")
                    .description("Trusted neighbourhood pharmacy with a wide medicine range.")
                    .addressLine("Road No. 12, Banjara Hills")
                    .city("Hyderabad")
                    .state("Telangana")
                    .postalCode("500034")
                    .latitude(17.4126)
                    .longitude(78.4483)
                    .phone("9100000001")
                    .email("contact@apollocare.example.com")
                    .openingTime(LocalTime.of(8, 0))
                    .closingTime(LocalTime.of(22, 0))
                    .is24Hours(false)
                    .verificationStatus(Pharmacy.VerificationStatus.VERIFIED)
                    .active(true)
                    .rating(4.5)
                    .build();
            pharmacyRepository.save(pharmacy);
            log.info("Created default pharmacy for Suresh Reddy: Apollo Care Pharmacy");
        }

        log.info("Initialized default users (admin@medifindai.com, ravi.kumar@example.com, suresh.pharmacy@example.com)");
    }

    private void seedMedicinesAndStock() {
        if (medicineRepository.count() > 0) {
            return;
        }

        log.info("Seeding initial medicine categories, medicines with barcodes, and stock...");

        MedicineCategory analgesics = categoryRepository.save(MedicineCategory.builder().name("Analgesics").description("Pain relief").build());
        MedicineCategory antibiotics = categoryRepository.save(MedicineCategory.builder().name("Antibiotics").description("Bacterial infection").build());
        MedicineCategory antipyretics = categoryRepository.save(MedicineCategory.builder().name("Antipyretics").description("Fever reduction").build());
        MedicineCategory antacids = categoryRepository.save(MedicineCategory.builder().name("Antacids").description("Digestive and acidity").build());
        MedicineCategory vitamins = categoryRepository.save(MedicineCategory.builder().name("Vitamins & Supplements").description("Nutritional supplements").build());

        Medicine med1 = medicineRepository.save(Medicine.builder()
                .name("Paracetamol 500mg")
                .genericName("Paracetamol")
                .manufacturer("Cipla Ltd")
                .category(antipyretics)
                .dosageForm("Tablet")
                .strength("500mg")
                .description("Used to treat fever and mild to moderate pain.")
                .requiresPrescription(false)
                .barcode("8901088012345")
                .build());

        Medicine med2 = medicineRepository.save(Medicine.builder()
                .name("Azithromycin 500mg")
                .genericName("Azithromycin")
                .manufacturer("Sun Pharma")
                .category(antibiotics)
                .dosageForm("Tablet")
                .strength("500mg")
                .description("Antibiotic used for bacterial infections.")
                .requiresPrescription(true)
                .barcode("8901088012346")
                .build());

        Medicine med3 = medicineRepository.save(Medicine.builder()
                .name("Cetirizine 10mg")
                .genericName("Cetirizine")
                .manufacturer("Dr. Reddy's")
                .category(analgesics)
                .dosageForm("Tablet")
                .strength("10mg")
                .description("Relieves allergy symptoms like sneezing and itching.")
                .requiresPrescription(false)
                .barcode("8901088012347")
                .build());

        Medicine med4 = medicineRepository.save(Medicine.builder()
                .name("Pantoprazole 40mg")
                .genericName("Pantoprazole")
                .manufacturer("Sun Pharma")
                .category(antacids)
                .dosageForm("Tablet")
                .strength("40mg")
                .description("Reduces stomach acid production.")
                .requiresPrescription(false)
                .barcode("8901088012348")
                .build());

        Medicine med5 = medicineRepository.save(Medicine.builder()
                .name("Amoxicillin 500mg")
                .genericName("Amoxicillin")
                .manufacturer("Cipla Ltd")
                .category(antibiotics)
                .dosageForm("Capsule")
                .strength("500mg")
                .description("Broad-spectrum antibiotic.")
                .requiresPrescription(true)
                .barcode("8901088012350")
                .build());

        // Stock for first pharmacy if available
        Pharmacy firstPharmacy = pharmacyRepository.findAll().stream().findFirst().orElse(null);
        if (firstPharmacy != null) {
            stockRepository.save(MedicineStock.builder()
                    .pharmacy(firstPharmacy)
                    .medicine(med1)
                    .quantity(250)
                    .price(BigDecimal.valueOf(25.00))
                    .stockStatus(MedicineStock.StockStatus.AVAILABLE)
                    .lowStockThreshold(20)
                    .build());

            stockRepository.save(MedicineStock.builder()
                    .pharmacy(firstPharmacy)
                    .medicine(med3)
                    .quantity(8)
                    .price(BigDecimal.valueOf(45.00))
                    .stockStatus(MedicineStock.StockStatus.LOW_STOCK)
                    .lowStockThreshold(10)
                    .build());
        }

        log.info("Initialized sample medicines with barcodes (e.g. 8901088012345) and initial stock.");
    }

    private void seedSampleNotifications() {
        if (notificationRepository.count() > 0) {
            return;
        }

        userRepository.findByEmail("admin@medifindai.com").ifPresent(admin -> {
            notificationRepository.save(Notification.builder()
                    .user(admin)
                    .title("System Health Nominal")
                    .message("All backend microservices and database connections are operational.")
                    .type(Notification.Type.SYSTEM)
                    .actionUrl("/admin/dashboard")
                    .read(false)
                    .build());
        });

        userRepository.findByEmail("suresh.pharmacy@example.com").ifPresent(owner -> {
            notificationRepository.save(Notification.builder()
                    .user(owner)
                    .title("Low Stock Warning: Cetirizine 10mg")
                    .message("Current inventory for Cetirizine 10mg is 8 units (Threshold: 10).")
                    .type(Notification.Type.STOCK_ALERT)
                    .actionUrl("/pharmacy-owner/inventory")
                    .read(false)
                    .build());
        });

        userRepository.findByEmail("ravi.kumar@example.com").ifPresent(user -> {
            notificationRepository.save(Notification.builder()
                    .user(user)
                    .title("Welcome to MediFindAI")
                    .message("Discover verified pharmacies, search medicines with voice, and hold stock for 24 hours.")
                    .type(Notification.Type.SYSTEM)
                    .actionUrl("/dashboard/search")
                    .read(false)
                    .build());
        });

        log.info("Initialized sample notifications for test users.");
    }
}
