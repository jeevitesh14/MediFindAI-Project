package com.medifindai.controller;

import com.medifindai.dto.common.ApiResponse;
import com.medifindai.dto.notification.NotificationDto;
import com.medifindai.security.UserPrincipal;
import com.medifindai.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationDto>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
        Page<NotificationDto> notifications = notificationService.getUserNotifications(principal.getId(), pageable);
        return ApiResponse.success(notifications.getContent());
    }

    @GetMapping("/recent")
    public ApiResponse<List<NotificationDto>> getRecentNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit) {
        List<NotificationDto> list = notificationService.getRecentNotifications(principal.getId(), limit);
        return ApiResponse.success(list);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ApiResponse.success(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationDto> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        NotificationDto result = notificationService.markAsRead(principal.getId(), id);
        return ApiResponse.success("Notification marked as read.", result);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ApiResponse.success("All notifications marked as read.", null);
    }
}
