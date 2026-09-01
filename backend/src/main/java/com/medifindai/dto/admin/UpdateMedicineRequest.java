package com.medifindai.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMedicineRequest {
    @NotBlank(message = "Medicine name is required.")
    private String name;
    private String genericName;
    private String manufacturer;
    private Long categoryId;
    private String dosageForm;
    private String strength;
    private String description;
    private boolean requiresPrescription;
    private String barcode;
    private String imageUrl;
}
