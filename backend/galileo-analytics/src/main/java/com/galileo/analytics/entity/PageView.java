package com.galileo.analytics.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "page_views", indexes = {
    @Index(name = "idx_page_views_page_path", columnList = "page_path"),
    @Index(name = "idx_page_views_viewed_at", columnList = "viewed_at"),
    @Index(name = "idx_page_views_user_id", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageView {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "page_path", nullable = false)
    private String pagePath;
    
    @Column(name = "page_title")
    private String pageTitle;
    
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "referrer")
    private String referrer;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "country")
    private String country;
    
    @Column(name = "device_type")
    private String deviceType;
    
    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;
    
    @Column(name = "duration_seconds")
    private Integer durationSeconds;
    
    @PrePersist
    protected void onCreate() {
        if (viewedAt == null) {
            viewedAt = LocalDateTime.now();
        }
    }
}

