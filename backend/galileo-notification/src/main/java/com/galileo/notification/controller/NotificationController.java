package com.galileo.notification.controller;

import com.galileo.notification.dto.CreateNotificationDTO;
import com.galileo.notification.dto.NotificationDTO;
import com.galileo.notification.dto.NotificationStatsDTO;
import com.galileo.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * Créer une nouvelle notification
     */
    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(
            @Valid @RequestBody CreateNotificationDTO createDTO) {
        log.info("Création de notification pour l'utilisateur {}", createDTO.getUserId());
        NotificationDTO notification = notificationService.createNotification(createDTO);
        return ResponseEntity.ok(notification);
    }
    
    /**
     * Récupérer toutes les notifications d'un utilisateur (path variable)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<NotificationDTO>> getNotifications(
            @PathVariable String userId) {
        log.info("Récupération des notifications pour: {}", userId);
        List<NotificationDTO> notifications = notificationService.getNotifications(userId);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Récupérer les notifications avec pagination (path variable)
     */
    @GetMapping("/{userId}/paginated")
    public ResponseEntity<Page<NotificationDTO>> getNotificationsPaginated(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Récupération des notifications paginées pour: {} (page {}, size {})", userId, page, size);
        Page<NotificationDTO> notifications = notificationService.getNotificationsPaginated(
                userId, 
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Récupérer les notifications non lues (path variable)
     */
    @GetMapping("/{userId}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(
            @PathVariable String userId) {
        log.info("Récupération des notifications non lues pour: {}", userId);
        List<NotificationDTO> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Récupérer les statistiques de notifications (path variable)
     */
    @GetMapping("/{userId}/stats")
    public ResponseEntity<NotificationStatsDTO> getStats(@PathVariable String userId) {
        log.info("Récupération des stats de notifications pour: {}", userId);
        NotificationStatsDTO stats = notificationService.getStats(userId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Marquer une notification comme lue (path variable pour notification)
     */
    @PatchMapping("/{userId}/{notificationId}/read")
    public ResponseEntity<NotificationDTO> markAsRead(
            @PathVariable String userId,
            @PathVariable String notificationId) {
        log.info("Marquage de la notification {} comme lue pour l'utilisateur {}", notificationId, userId);
        NotificationDTO notification = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(notification);
    }
    
    /**
     * Marquer toutes les notifications comme lues (path variable)
     */
    @PatchMapping("/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable String userId) {
        log.info("Marquage de toutes les notifications comme lues pour: {}", userId);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Supprimer une notification (path variable pour user et notification)
     */
    @DeleteMapping("/{userId}/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable String userId,
            @PathVariable String notificationId) {
        log.info("Suppression de la notification {} pour l'utilisateur {}", notificationId, userId);
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }
}

