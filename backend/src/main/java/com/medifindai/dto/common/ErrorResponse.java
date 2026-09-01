package com.medifindai.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private boolean success;
    private String message;
    private int status;
    private String path;
    private List<String> errors;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
