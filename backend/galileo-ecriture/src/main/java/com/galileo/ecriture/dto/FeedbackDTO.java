package com.galileo.ecriture.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour le feedback de modération sur une soumission
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {
    private Long id;
    private Long soumissionId;
    private String moderatorEmail;
    private String moderatorName;
    private String commentaire;
    private String statut; // APPROVED, REJECTED, REVISION_REQUESTED
    private LocalDateTime createdAt;
    private boolean internal; // true = visible seulement par STAFF/ADMIN
}
