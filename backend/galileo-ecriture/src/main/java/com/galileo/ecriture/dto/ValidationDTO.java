package com.galileo.ecriture.dto;

import jakarta.validation.constraints.Size;

/**
 * DTO pour valider une soumission (Admin)
 */
public class ValidationDTO {

    @Size(max = 1000, message = "Le commentaire ne peut pas dépasser 1000 caractères")
    private String commentaire;

    // Constructeurs
    public ValidationDTO() {}

    public ValidationDTO(String commentaire) {
        this.commentaire = commentaire;
    }

    // Getters et Setters
    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }
}
