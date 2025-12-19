package com.galileo.lecture.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDTO {
    
    private Long id;
    private String name;
    private String role;
    private String description;
    private String imageUrl;
    private String location;
    private String email;
    private String phone;
    private String motivation;
    private String linkedinUrl;
}
