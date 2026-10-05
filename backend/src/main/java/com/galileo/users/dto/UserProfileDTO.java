package com.galileo.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private Long id;
    private Long userId;
    private String email;
    private String role;
    private String firstName;
    private String lastName;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private Long institutionId;
    private String institutionName;
    private String department;
    private String program;
    private String academicYear;
    private String level;
    private String[] interests;
    private String websiteUrl;
    private String orcid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
