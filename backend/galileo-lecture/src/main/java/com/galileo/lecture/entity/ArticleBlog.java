package com.galileo.lecture.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité ArticleBlog
 * Représente un article de blog scientifique
 */
@Entity
@Table(name = "articles_blog")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleBlog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(nullable = false, length = 1000)
    private String resume;

    @Column(nullable = false)
    private String auteur;

    @Column(length = 500)
    private String categorie;

    @Column(name = "mots_cles", length = 500)
    private String motsCles;

    @Column(name = "url_image_principale", length = 1000)
    private String urlImagePrincipale;

    @Column(name = "temps_lecture")
    private Integer tempsLecture; // En minutes

    @Column(name = "nombre_vues")
    @Builder.Default
    private Integer nombreVues = 0;

    @Column(name = "date_publication", nullable = false)
    private LocalDateTime datePublication;

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
        if (datePublication == null) {
            datePublication = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }
}
