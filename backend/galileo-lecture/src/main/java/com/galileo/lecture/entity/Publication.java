package com.galileo.lecture.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Publication - Lecture publique
 * Représente une publication scientifique validée
 */
@Entity
@Table(name = "publications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(nullable = false, length = 2000)
    private String resume;

    @Column(name = "auteur_principal", nullable = false)
    private String auteurPrincipal;

    @Column(name = "co_auteurs", length = 1000)
    private String coAuteurs;

    @Column(nullable = false, length = 200)
    private String domaine;

    @Column(name = "mots_cles", length = 500)
    private String motsCles;

    @Column(name = "url_pdf", nullable = false, length = 1000)
    private String urlPdf; // URL depuis Cloudflare R2

    @Column(name = "url_image_couverture", length = 1000)
    private String urlImageCouverture; // URL depuis Cloudflare R2

    // Métadonnées R2 pour régénération des URLs
    @Column(name = "r2_key_pdf", length = 500)
    private String r2KeyPdf; // Clé du fichier PDF dans R2 (permanent, utilisé pour régénérer les URLs signées)

    @Column(name = "taille_fichier")
    private Long tailleFichier; // En octets

    @Column(name = "nombre_pages")
    private Integer nombrePages;

    @Column(name = "nombre_vues")
    @Builder.Default
    private Integer nombreVues = 0;

    @Column(name = "nombre_telechargements")
    @Builder.Default
    private Integer nombreTelechargements = 0;

    @Column(name = "date_publication", nullable = false)
    private LocalDateTime datePublication;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @Column(nullable = false)
    @Builder.Default
    private Boolean publiee = true;

    @Column(name = "source_soumission_id")
    private Long sourceSoumissionId; // Référence à la soumission originale

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (datePublication == null) {
            datePublication = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }
}
