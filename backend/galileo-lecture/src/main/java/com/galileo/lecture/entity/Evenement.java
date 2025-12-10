package com.galileo.lecture.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Evenement
 * Représente un événement scientifique (conférence, séminaire, etc.)
 */
@Entity
@Table(name = "evenements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 200)
    private String type; // Conférence, Séminaire, Workshop, etc.

    @Column(nullable = false)
    private String organisateur;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(length = 500)
    private String lieu;

    @Column(name = "lieu_virtuel", length = 1000)
    private String lieuVirtuel; // URL pour événements en ligne

    @Column(name = "url_inscription", length = 1000)
    private String urlInscription;

    @Column(name = "url_image", length = 1000)
    private String urlImage;

    @Column(name = "nombre_participants_max")
    private Integer nombreParticipantsMax;

    @Column(name = "nombre_inscrits")
    @Builder.Default
    private Integer nombreInscrits = 0;

    @Column(name = "mots_cles", length = 500)
    private String motsCles;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @Column(nullable = false)
    @Builder.Default
    private Boolean publie = true;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    /**
     * Vérifier si l'événement est passé
     */
    public boolean estPasse() {
        LocalDateTime dateFin = this.dateFin != null ? this.dateFin : this.dateDebut;
        return dateFin.isBefore(LocalDateTime.now());
    }

    /**
     * Vérifier si l'événement est complet
     */
    public boolean estComplet() {
        if (nombreParticipantsMax == null) {
            return false;
        }
        return nombreInscrits >= nombreParticipantsMax;
    }
}
