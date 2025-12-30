package com.galileo.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationStatsDTO {
    
    private long totalNotifications;
    private long unreadCount;
    private long todayCount;
}

