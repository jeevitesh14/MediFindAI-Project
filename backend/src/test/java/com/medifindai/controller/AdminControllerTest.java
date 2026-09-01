package com.medifindai.controller;

import com.medifindai.dto.admin.AdminDashboardStatsDto;
import com.medifindai.dto.admin.AdminUserDto;
import com.medifindai.dto.common.ApiResponse;
import com.medifindai.service.AdminService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    @Test
    void getStats_success() {
        AdminDashboardStatsDto stats = AdminDashboardStatsDto.builder()
                .totalUsers(10)
                .totalPharmacies(5)
                .totalMedicines(20)
                .totalReservations(8)
                .build();

        when(adminService.getDashboardStats()).thenReturn(stats);

        ApiResponse<AdminDashboardStatsDto> response = adminController.getDashboardStats();

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().getTotalUsers()).isEqualTo(10);
        assertThat(response.getData().getTotalPharmacies()).isEqualTo(5);
    }

    @Test
    void getUsers_success() {
        AdminUserDto user = AdminUserDto.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .role("USER")
                .active(true)
                .build();

        when(adminService.getUsers(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));

        ApiResponse<List<AdminUserDto>> response = adminController.getUsers(null, null, 0, 50);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).hasSize(1);
        assertThat(response.getData().get(0).getEmail()).isEqualTo("john@example.com");
    }
}
