package com.galileo.ecriture.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité pour l'audit logging des actions administratives
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_email", nullable = false)
    private String userEmail;
    
    @Column(name = "user_role", nullable = false)
    private String userRole;
    
    @Column(nullable = false)
    private String action; // CREATE, UPDATE, DELETE, APPROVE, REJECT, etc.
    
    @Column(name = "resource_type", nullable = false)
    private String resourceType; // USER, SOUMISSION, PUBLICATION, etc.
    
    @Column(name = "resource_id")
    private String resourceId;
    
    @Column(columnDefinition = "TEXT")
    private String details; // JSON avec détails de l'action
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
