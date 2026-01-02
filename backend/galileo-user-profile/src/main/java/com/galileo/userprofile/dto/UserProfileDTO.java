package com.galileo.userprofile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {
    
    private Long id;
    private String firebaseUid;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String institution;
    private String fieldOfStudy;
    private String preferredLanguage;
    private Boolean darkModeEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Statistiques enrichies
    private Long favoritesCount;
    private Long publicationsReadCount;
    private Long totalReadingTimeMinutes;
}

