package com.galileo.ecriture.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité pour stocker les feedbacks de modération sur les soumissions
 */
@Entity
@Table(name = "feedbacks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "soumission_id", nullable = false)
    private Soumission soumission;
    
    @Column(name = "moderator_email", nullable = false)
    private String moderatorEmail;
    
    @Column(name = "moderator_name")
    private String moderatorName;
    
    @Column(columnDefinition = "TEXT")
    private String commentaire;
    
    @Column(nullable = false)
    private String statut; // APPROVED, REJECTED, REVISION_REQUESTED
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "is_internal")
    private boolean internal = false; // true = visible seulement par STAFF/ADMIN
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
