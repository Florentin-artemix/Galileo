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
    
    @NotBlank(message = "Le nom est requis")
    private String name;
    
    @NotBlank(message = "Le rôle est requis")
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
