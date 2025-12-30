package com.galileo.userprofile.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "firebase_uid", unique = true, nullable = false)
    private String firebaseUid;
    
    @Column(name = "display_name")
    private String displayName;
    
    @Column(name = "bio", length = 1000)
    private String bio;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(name = "institution")
    private String institution;
    
    @Column(name = "field_of_study")
    private String fieldOfStudy;
    
    @Column(name = "preferred_language")
    private String preferredLanguage;
    
    @Column(name = "dark_mode_enabled")
    private Boolean darkModeEnabled;
    
    @Column(name = "email_notifications_enabled")
    private Boolean emailNotificationsEnabled;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (preferredLanguage == null) preferredLanguage = "fr";
        if (darkModeEnabled == null) darkModeEnabled = false;
        if (emailNotificationsEnabled == null) emailNotificationsEnabled = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

