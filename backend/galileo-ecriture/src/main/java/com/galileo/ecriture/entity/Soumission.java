package com.galileo.ecriture.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Soumission - Workflow de validation
 * Représente une soumission étudiante en attente de validation
 */
@Entity
@Table(name = "soumissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Soumission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Informations publication
    @Column(nullable = false, length = 500)
    private String titre;

    @Column(nullable = false, length = 2000)
    private String resume;

    @Column(name = "auteur_principal", nullable = false)
    private String auteurPrincipal;

    @Column(name = "email_auteur", nullable = false)
    private String emailAuteur;

    @ElementCollection
    @CollectionTable(name = "soumission_co_auteurs", joinColumns = @JoinColumn(name = "soumission_id"))
    @Column(name = "nom_auteur")
    private java.util.List<String> coAuteurs;

    @Column(name = "domaine_recherche", nullable = false, length = 200)
    private String domaineRecherche;

    @ElementCollection
    @CollectionTable(name = "soumission_mots_cles", joinColumns = @JoinColumn(name = "soumission_id"))
    @Column(name = "mot_cle")
    private java.util.List<String> motsCles;

    @Column(name = "nombre_pages")
    private Integer nombrePages;

    @Column(length = 1000)
    private String notes; // Notes supplémentaires de l'auteur

    // Fichiers (URLs Cloudflare R2)
    @Column(name = "url_pdf", nullable = false, length = 1000)
    private String urlPdf;

    @Column(name = "url_image_couverture", length = 1000)
    private String urlImageCouverture;

    @Column(name = "taille_fichier")
    private Long tailleFichier;

    // Métadonnées R2
    @Column(name = "r2_key_pdf", length = 500)
    private String r2KeyPdf; // Clé du fichier dans R2

    @Column(name = "r2_key_image", length = 500)
    private String r2KeyImage;

    // Workflow
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private StatutSoumission statut = StatutSoumission.EN_ATTENTE;

    @Column(name = "commentaire_admin", columnDefinition = "TEXT")
    private String commentaireAdmin;

    @Column(name = "validee_par")
    private String valideePar; // Email de l'admin qui a validé

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "publication_id")
    private Long publicationId; // ID de la publication créée après validation

    // Informations utilisateur Firebase
    @Column(name = "user_id", nullable = false)
    private String userId; // Firebase UID

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    // Dates
    @Column(name = "date_soumission", nullable = false, updatable = false)
    private LocalDateTime dateSoumission;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateSoumission = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    /**
     * Statuts possibles d'une soumission
     */
    public enum StatutSoumission {
        EN_ATTENTE,      // Soumission en attente de validation
        EN_REVISION,     // En cours de révision par un admin
        VALIDEE,         // Validée et publiée
        REJETEE,         // Rejetée avec commentaire
        RETIREE          // Retirée par l'auteur
    }
}
