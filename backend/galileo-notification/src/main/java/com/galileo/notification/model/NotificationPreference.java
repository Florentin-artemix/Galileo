package com.galileo.notification.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Document(collection = "notification_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String userId;
    
    private boolean inAppEnabled;
    
    private Set<Notification.NotificationType> mutedTypes;
    
    private String preferredLanguage;
}

