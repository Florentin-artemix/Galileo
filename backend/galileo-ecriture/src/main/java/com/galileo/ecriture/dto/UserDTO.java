package com.galileo.ecriture.dto;

import com.galileo.ecriture.security.Role;

/**
 * DTO pour les informations utilisateur
 */
public class UserDTO {
    private String uid;
    private String email;
    private String displayName;
    private Role role;
    private String creationTime;
    private String lastSignInTime;
    private boolean disabled;

    public UserDTO() {}

    public UserDTO(String uid, String email, String displayName, Role role) {
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
    }

    // Getters et Setters
    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getCreationTime() { return creationTime; }
    public void setCreationTime(String creationTime) { this.creationTime = creationTime; }

    public String getLastSignInTime() { return lastSignInTime; }
    public void setLastSignInTime(String lastSignInTime) { this.lastSignInTime = lastSignInTime; }

    public boolean isDisabled() { return disabled; }
    public void setDisabled(boolean disabled) { this.disabled = disabled; }
}
