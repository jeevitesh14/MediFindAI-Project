package com.medifindai.service.impl;

import com.medifindai.dto.notification.NotificationDto;
import com.medifindai.entity.Notification;
import com.medifindai.entity.Role;
import com.medifindai.entity.User;
import com.medifindai.exception.ResourceNotFoundException;
import com.medifindai.repository.NotificationRepository;
import com.medifindai.repository.UserRepository;
import com.medifindai.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getRecentNotifications(Long userId, int limit) {
        Pageable pageable = PageRequest.of(0, Math.max(1, Math.min(limit, 50)));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .getContent()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationDto markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found for user: " + userId);
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    @Override
    @Transactional
    public Notification createNotification(User user, String title, String message, Notification.Type type, Long referenceId, String actionUrl) {
        if (user == null) return null;

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type != null ? type : Notification.Type.SYSTEM)
                .referenceId(referenceId)
                .actionUrl(actionUrl)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification for user {}: {}", user.getEmail(), title);
        return saved;
    }

    @Override
    @Transactional
    public void sendNotificationToAdmins(String title, String message, Notification.Type type, Long referenceId, String actionUrl) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            createNotification(admin, title, message, type, referenceId, actionUrl);
        }
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType() != null ? n.getType().name() : "SYSTEM")
                .referenceId(n.getReferenceId())
                .actionUrl(n.getActionUrl())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
