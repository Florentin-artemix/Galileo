package com.galileo.notification.service;

import com.galileo.notification.dto.NotificationPreferenceDTO;
import com.galileo.notification.model.Notification;
import com.galileo.notification.model.NotificationPreference;
import com.galileo.notification.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceService {
    
    private final NotificationPreferenceRepository preferenceRepository;
    
    public NotificationPreferenceDTO getPreferences(String userId) {
        NotificationPreference preferences = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
        
        return toDTO(preferences);
    }
    
    public NotificationPreferenceDTO updatePreferences(String userId, NotificationPreferenceDTO updateDTO) {
        NotificationPreference preferences = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
        
        if (updateDTO.isEmailEnabled() != preferences.isEmailEnabled()) {
            preferences.setEmailEnabled(updateDTO.isEmailEnabled());
        }
        if (updateDTO.isInAppEnabled() != preferences.isInAppEnabled()) {
            preferences.setInAppEnabled(updateDTO.isInAppEnabled());
        }
        if (updateDTO.getMutedTypes() != null) {
            preferences.setMutedTypes(updateDTO.getMutedTypes());
        }
        if (updateDTO.getEmail() != null) {
            preferences.setEmail(updateDTO.getEmail());
        }
        if (updateDTO.getPreferredLanguage() != null) {
            preferences.setPreferredLanguage(updateDTO.getPreferredLanguage());
        }
        
        preferences = preferenceRepository.save(preferences);
        log.info("Préférences de notification mises à jour pour l'utilisateur {}", userId);
        
        return toDTO(preferences);
    }
    
    public void muteNotificationType(String userId, Notification.NotificationType type) {
        NotificationPreference preferences = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
        
        Set<Notification.NotificationType> mutedTypes = preferences.getMutedTypes();
        if (mutedTypes == null) {
            mutedTypes = new HashSet<>();
        }
        mutedTypes.add(type);
        preferences.setMutedTypes(mutedTypes);
        
        preferenceRepository.save(preferences);
        log.info("Type de notification {} muté pour l'utilisateur {}", type, userId);
    }
    
    public void unmuteNotificationType(String userId, Notification.NotificationType type) {
        NotificationPreference preferences = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
        
        if (preferences.getMutedTypes() != null) {
            preferences.getMutedTypes().remove(type);
            preferenceRepository.save(preferences);
            log.info("Type de notification {} réactivé pour l'utilisateur {}", type, userId);
        }
    }
    
    private NotificationPreference createDefaultPreferences(String userId) {
        NotificationPreference preferences = NotificationPreference.builder()
                .userId(userId)
                .emailEnabled(true)
                .inAppEnabled(true)
                .mutedTypes(new HashSet<>())
                .preferredLanguage("fr")
                .build();
        
        preferences = preferenceRepository.save(preferences);
        log.info("Préférences de notification par défaut créées pour l'utilisateur {}", userId);
        
        return preferences;
    }
    
    private NotificationPreferenceDTO toDTO(NotificationPreference preferences) {
        return NotificationPreferenceDTO.builder()
                .userId(preferences.getUserId())
                .emailEnabled(preferences.isEmailEnabled())
                .inAppEnabled(preferences.isInAppEnabled())
                .mutedTypes(preferences.getMutedTypes())
                .email(preferences.getEmail())
                .preferredLanguage(preferences.getPreferredLanguage())
                .build();
    }
}

