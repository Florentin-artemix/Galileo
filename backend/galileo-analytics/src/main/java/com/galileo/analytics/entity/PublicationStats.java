package com.galileo.analytics.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "publication_stats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"publication_id", "stat_date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicationStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "publication_id", nullable = false)
    private Long publicationId;
    
    @Column(name = "publication_title")
    private String publicationTitle;
    
    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;
    
    @Column(name = "views_count")
    private Long viewsCount;
    
    @Column(name = "unique_visitors")
    private Long uniqueVisitors;
    
    @Column(name = "downloads_count")
    private Long downloadsCount;
    
    @Column(name = "favorites_count")
    private Long favoritesCount;
    
    @Column(name = "avg_reading_time_seconds")
    private Long avgReadingTimeSeconds;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (viewsCount == null) viewsCount = 0L;
        if (uniqueVisitors == null) uniqueVisitors = 0L;
        if (downloadsCount == null) downloadsCount = 0L;
        if (favoritesCount == null) favoritesCount = 0L;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

