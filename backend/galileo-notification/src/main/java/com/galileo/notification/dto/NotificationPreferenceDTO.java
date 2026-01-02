package com.galileo.notification.dto;

import com.galileo.notification.model.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDTO {
    
    private String userId;
    private boolean inAppEnabled;
    private Set<Notification.NotificationType> mutedTypes;
    private String preferredLanguage;
}

