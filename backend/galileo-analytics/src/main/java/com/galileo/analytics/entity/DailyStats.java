package com.galileo.analytics.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "stat_date", unique = true, nullable = false)
    private LocalDate statDate;
    
    @Column(name = "total_page_views")
    private Long totalPageViews;
    
    @Column(name = "unique_visitors")
    private Long uniqueVisitors;
    
    @Column(name = "new_users")
    private Long newUsers;
    
    @Column(name = "returning_users")
    private Long returningUsers;
    
    @Column(name = "publications_viewed")
    private Long publicationsViewed;
    
    @Column(name = "total_downloads")
    private Long totalDownloads;
    
    @Column(name = "new_submissions")
    private Long newSubmissions;
    
    @Column(name = "avg_session_duration_seconds")
    private Long avgSessionDurationSeconds;
    
    @Column(name = "bounce_rate")
    private Double bounceRate;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (totalPageViews == null) totalPageViews = 0L;
        if (uniqueVisitors == null) uniqueVisitors = 0L;
        if (newUsers == null) newUsers = 0L;
        if (returningUsers == null) returningUsers = 0L;
        if (publicationsViewed == null) publicationsViewed = 0L;
        if (totalDownloads == null) totalDownloads = 0L;
        if (newSubmissions == null) newSubmissions = 0L;
    }
}

