package com.galileo.userprofile.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileDTO {
    
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String displayName;
    
    @Size(max = 1000, message = "La bio ne peut pas dépasser 1000 caractères")
    private String bio;
    
    private String avatarUrl;
    
    @Size(max = 200, message = "L'institution ne peut pas dépasser 200 caractères")
    private String institution;
    
    @Size(max = 100, message = "Le domaine d'étude ne peut pas dépasser 100 caractères")
    private String fieldOfStudy;
    
    private String preferredLanguage;
    
    private Boolean darkModeEnabled;
    
    private Boolean emailNotificationsEnabled;
}

