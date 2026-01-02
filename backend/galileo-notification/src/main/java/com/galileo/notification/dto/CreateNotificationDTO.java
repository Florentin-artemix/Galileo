package com.galileo.notification.dto;

import com.galileo.notification.model.Notification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNotificationDTO {
    
    @NotBlank(message = "L'ID utilisateur est requis")
    private String userId;
    
    @NotNull(message = "Le type de notification est requis")
    private Notification.NotificationType type;
    
    @NotBlank(message = "Le titre est requis")
    private String title;
    
    @NotBlank(message = "Le message est requis")
    private String message;
    
    private Map<String, Object> data;
}

