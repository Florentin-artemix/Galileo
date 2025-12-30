package com.galileo.userprofile.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reading_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "firebase_uid", nullable = false)
    private String firebaseUid;
    
    @Column(name = "publication_id", nullable = false)
    private Long publicationId;
    
    @Column(name = "publication_title")
    private String publicationTitle;
    
    @Column(name = "publication_domain")
    private String publicationDomain;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "reading_duration_seconds")
    private Integer readingDurationSeconds;
    
    @Column(name = "progress_percentage")
    private Integer progressPercentage;
    
    @PrePersist
    protected void onCreate() {
        readAt = LocalDateTime.now();
        if (progressPercentage == null) progressPercentage = 0;
    }
}

