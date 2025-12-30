package com.galileo.notification.dto;

import com.galileo.notification.model.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    
    private String id;
    private String userId;
    private Notification.NotificationType type;
    private String title;
    private String message;
    private Map<String, Object> data;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}

