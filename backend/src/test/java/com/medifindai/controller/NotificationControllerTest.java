package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.notification.NotificationDto;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private UserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Test User")
                .role(Role.USER)
                .active(true)
                .build();
        testPrincipal = new UserPrincipal(user);
    }

    @Test
    void getRecentNotifications_success() {
        NotificationDto dto = NotificationDto.builder()
                .id(10L)
                .title("Reservation Ready")
                .message("Your medicine is ready for pickup")
                .type("RESERVATION")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.getRecentNotifications(anyLong(), anyInt())).thenReturn(List.of(dto));

        ApiResponse<List<NotificationDto>> response = notificationController.getRecentNotifications(testPrincipal, 10);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).hasSize(1);
        assertThat(response.getData().get(0).getTitle()).isEqualTo("Reservation Ready");
    }

    @Test
    void getUnreadCount_success() {
        when(notificationService.getUnreadCount(1L)).thenReturn(3L);

        ApiResponse<Map<String, Long>> response = notificationController.getUnreadCount(testPrincipal);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().get("unreadCount")).isEqualTo(3L);
    }

    @Test
    void markAsRead_success() {
        NotificationDto dto = NotificationDto.builder().id(10L).read(true).build();
        when(notificationService.markAsRead(1L, 10L)).thenReturn(dto);

        ApiResponse<NotificationDto> response = notificationController.markAsRead(testPrincipal, 10L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().isRead()).isTrue();
    }

    @Test
    void markAllAsRead_success() {
        ApiResponse<Void> response = notificationController.markAllAsRead(testPrincipal);

        assertThat(response.isSuccess()).isTrue();
        verify(notificationService).markAllAsRead(1L);
    }
}
