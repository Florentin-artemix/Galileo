package com.galileo.notification.controller;

import com.galileo.notification.dto.NotificationPreferenceDTO;
import com.galileo.notification.model.Notification;
import com.galileo.notification.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications/preferences")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationPreferenceController {
    
    private final NotificationPreferenceService preferenceService;
    
    /**
     * Récupérer les préférences de notification d'un utilisateur
     */
    @GetMapping
    public ResponseEntity<NotificationPreferenceDTO> getPreferences(@RequestParam String userId) {
        log.info("Récupération des préférences pour: {}", userId);
        NotificationPreferenceDTO preferences = preferenceService.getPreferences(userId);
        return ResponseEntity.ok(preferences);
    }
    
    /**
     * Mettre à jour les préférences de notification
     */
    @PutMapping
    public ResponseEntity<NotificationPreferenceDTO> updatePreferences(
            @RequestParam String userId,
            @RequestBody NotificationPreferenceDTO updateDTO) {
        log.info("Mise à jour des préférences pour: {}", userId);
        NotificationPreferenceDTO preferences = preferenceService.updatePreferences(userId, updateDTO);
        return ResponseEntity.ok(preferences);
    }
    
    /**
     * Muter un type de notification
     */
    @PostMapping("/mute")
    public ResponseEntity<Void> muteNotificationType(
            @RequestParam String userId,
            @RequestParam Notification.NotificationType type) {
        log.info("Muter le type {} pour: {}", type, userId);
        preferenceService.muteNotificationType(userId, type);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Réactiver un type de notification
     */
    @PostMapping("/unmute")
    public ResponseEntity<Void> unmuteNotificationType(
            @RequestParam String userId,
            @RequestParam Notification.NotificationType type) {
        log.info("Réactiver le type {} pour: {}", type, userId);
        preferenceService.unmuteNotificationType(userId, type);
        return ResponseEntity.noContent().build();
    }
}

