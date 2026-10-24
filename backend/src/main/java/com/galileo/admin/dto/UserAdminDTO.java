package com.galileo.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminDTO {
    private Long id;
    private String uid;
    private String email;
    private String role;
    private Boolean disabled;
    private Boolean isActive;
    private String creationTime;
    private String lastSignInTime;
    private String displayName;
}

