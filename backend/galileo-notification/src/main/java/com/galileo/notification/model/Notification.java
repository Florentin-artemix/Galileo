package com.galileo.notification.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private NotificationType type;
    
    private String title;
    
    private String message;
    
    private Map<String, Object> data;
    
    private boolean read;
    
    private boolean emailSent;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
    
    public enum NotificationType {
        SUBMISSION_RECEIVED,      // Soumission reçue
        SUBMISSION_VALIDATED,     // Soumission validée
        SUBMISSION_REJECTED,      // Soumission rejetée
        PUBLICATION_PUBLISHED,    // Publication publiée
        NEW_COMMENT,              // Nouveau commentaire
        FAVORITE_UPDATE,          // Mise à jour d'un favori
        SYSTEM_ANNOUNCEMENT,      // Annonce système
        WELCOME                   // Message de bienvenue
    }
}

