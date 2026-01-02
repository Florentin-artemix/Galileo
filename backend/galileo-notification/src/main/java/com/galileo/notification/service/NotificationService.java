package com.galileo.notification.service;

import com.galileo.notification.dto.CreateNotificationDTO;
import com.galileo.notification.dto.NotificationDTO;
import com.galileo.notification.dto.NotificationStatsDTO;
import com.galileo.notification.model.Notification;
import com.galileo.notification.model.NotificationPreference;
import com.galileo.notification.repository.NotificationPreferenceRepository;
import com.galileo.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    
    public NotificationDTO createNotification(CreateNotificationDTO createDTO) {
        // Vérifier les préférences utilisateur
        NotificationPreference preferences = preferenceRepository.findByUserId(createDTO.getUserId())
                .orElse(getDefaultPreferences(createDTO.getUserId()));
        
        // Vérifier si le type de notification est muté
        if (preferences.getMutedTypes() != null && 
            preferences.getMutedTypes().contains(createDTO.getType())) {
            log.info("Notification de type {} mutée pour l'utilisateur {}", 
                    createDTO.getType(), createDTO.getUserId());
            return null;
        }
        
        Notification notification = Notification.builder()
                .userId(createDTO.getUserId())
                .type(createDTO.getType())
                .title(createDTO.getTitle())
                .message(createDTO.getMessage())
                .data(createDTO.getData())
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        notification = notificationRepository.save(notification);
        log.info("Notification créée pour l'utilisateur {}: {}", createDTO.getUserId(), createDTO.getTitle());
        
        return toDTO(notification);
    }
    
    public List<NotificationDTO> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public Page<NotificationDTO> getNotificationsPaginated(String userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable)
                .map(this::toDTO);
    }
    
    public List<NotificationDTO> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public NotificationStatsDTO getStats(String userId) {
        long total = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).size();
        long unread = notificationRepository.countByUserIdAndReadFalse(userId);
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long today = notificationRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, todayStart).size();
        
        return NotificationStatsDTO.builder()
                .totalNotifications(total)
                .unreadCount(unread)
                .todayCount(today)
                .build();
    }
    
    public NotificationDTO markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notification = notificationRepository.save(notification);
        
        return toDTO(notification);
    }
    
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now();
        
        unread.forEach(n -> {
            n.setRead(true);
            n.setReadAt(now);
        });
        
        notificationRepository.saveAll(unread);
        log.info("Toutes les notifications marquées comme lues pour l'utilisateur {}", userId);
    }
    
    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }
    
    private NotificationPreference getDefaultPreferences(String userId) {
        return NotificationPreference.builder()
                .userId(userId)
                .inAppEnabled(true)
                .preferredLanguage("fr")
                .build();
    }
    
    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .data(notification.getData())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}

