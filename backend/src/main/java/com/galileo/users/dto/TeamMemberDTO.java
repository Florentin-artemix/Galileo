package com.galileo.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO public représentant un membre de l'équipe académique / institutionnelle de Galileo.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDTO {
    private Long id;
    private String uid;
    private String displayName;
    private String email;
    private String role;
    private String bio;
    private String department;
    private String avatarUrl;
    private String location;
    private String phone;

    // Propriétés calculées pour compatibilité descendante immédiate avec le frontend
    @JsonProperty("name")
    public String getName() {
        return displayName;
    }

    @JsonProperty("description")
    public String getDescription() {
        return bio;
    }

    @JsonProperty("imageUrl")
    public String getImageUrl() {
        return avatarUrl;
    }
}

