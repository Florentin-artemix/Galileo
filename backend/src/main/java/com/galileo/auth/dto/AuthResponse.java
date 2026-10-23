package com.galileo.auth.dto;

import com.galileo.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private Role role;
    private Long expiresIn;

    public String getToken() {
        return accessToken;
    }

    public UserSummary getUser() {
        return new UserSummary(userId, email, role != null ? role.name() : null);
    }

    public record UserSummary(Long id, String email, String role) {
        public Long getId() { return id; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
    }
}
