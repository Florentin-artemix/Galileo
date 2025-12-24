package com.galileo.ecriture.entity;

import com.galileo.ecriture.security.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité pour stocker les utilisateurs dans PostgreSQL
 * Synchronisée avec Firebase lors de l'inscription
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_uid", columnList = "uid", unique = true),
    @Index(name = "idx_user_email", columnList = "email", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uid", nullable = false, unique = true, length = 128)
    private String uid;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role = Role.VIEWER;

    @Column(name = "program", length = 255)
    private String program;

    @Column(name = "motivation", columnDefinition = "TEXT")
    private String motivation;

    @Column(name = "disabled", nullable = false)
    private Boolean disabled = false;

    @Column(name = "creation_time")
    private LocalDateTime creationTime;

    @Column(name = "last_sign_in_time")
    private LocalDateTime lastSignInTime;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (creationTime == null) {
            creationTime = LocalDateTime.now();
        }
        if (disabled == null) {
            disabled = false;
        }
        if (role == null) {
            role = Role.VIEWER;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


