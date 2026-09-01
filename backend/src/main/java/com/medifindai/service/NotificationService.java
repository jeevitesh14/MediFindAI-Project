package com.medifindai.service;

import com.medifindai.dto.notification.NotificationDto;
import com.medifindai.entity.Notification;
import com.medifindai.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    Page<NotificationDto> getUserNotifications(Long userId, Pageable pageable);
    List<NotificationDto> getRecentNotifications(Long userId, int limit);
    long getUnreadCount(Long userId);
    NotificationDto markAsRead(Long userId, Long notificationId);
    void markAllAsRead(Long userId);
    Notification createNotification(User user, String title, String message, Notification.Type type, Long referenceId, String actionUrl);
    void sendNotificationToAdmins(String title, String message, Notification.Type type, Long referenceId, String actionUrl);
}
