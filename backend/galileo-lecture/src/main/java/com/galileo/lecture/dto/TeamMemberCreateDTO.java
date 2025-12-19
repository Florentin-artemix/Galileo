package com.galileo.lecture.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberCreateDTO {
    
    private String firebaseUid;
    
    // Le nom peut être vide, on utilisera l'email par défaut
    private String name;
    
    // Le rôle peut être vide, on utilisera VIEWER par défaut
    private String role;
    
    private String description;
    private String imageUrl;
    private String location;
    private String email;
    private String phone;
    private String motivation;
    private String linkedinUrl;
    private Integer displayOrder;
}
