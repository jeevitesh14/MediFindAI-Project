package com.medifindai.dto.admin;

import com.medifindai.entity.Pharmacy;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyPharmacyRequest {
    @NotNull(message = "Verification status is required.")
    private Pharmacy.VerificationStatus status;
    private String remarks;
}
