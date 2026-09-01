package com.medifindai.dto.medicine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineSuggestionDto {
    private Long id;
    private String name;
    private String genericName;
    private String manufacturer;
    private String dosageForm;
    private String strength;
    private String category;
    private boolean requiresPrescription;
    private String barcode;
}

