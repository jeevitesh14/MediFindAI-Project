package com.medifindai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "medicines")
public class Medicine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "generic_name", length = 200)
    private String genericName;

    @Column(length = 150)
    private String manufacturer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private MedicineCategory category;

    @Column(name = "dosage_form", length = 50)
    private String dosageForm;

    @Column(length = 50)
    private String strength;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "requires_prescription", nullable = false)
    @Builder.Default
    private boolean requiresPrescription = false;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "barcode", unique = true, length = 100)
    private String barcode;
}

