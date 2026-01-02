package com.galileo.lecture.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Titre (FR/EN)
    @Column(name = "title_fr", nullable = false, length = 500)
    private String titleFr;

    @Column(name = "title_en", nullable = false, length = 500)
    private String titleEn;

    @Column(nullable = false)
    private LocalDate date;

    // Type (FR/EN)
    @Column(name = "type_fr", nullable = false, length = 100)
    private String typeFr;

    @Column(name = "type_en", nullable = false, length = 100)
    private String typeEn;

    // Domaine (FR/EN)
    @Column(name = "domain_fr", length = 200)
    private String domainFr;

    @Column(name = "domain_en", length = 200)
    private String domainEn;

    @Column(nullable = false, length = 500)
    private String location;

    // Résumé (FR/EN)
    @Column(name = "summary_fr", columnDefinition = "TEXT")
    private String summaryFr;

    @Column(name = "summary_en", columnDefinition = "TEXT")
    private String summaryEn;

    // Description (FR/EN)
    @Column(name = "description_fr", columnDefinition = "TEXT")
    private String descriptionFr;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    // Tags stockés en JSON ou séparés par virgule
    @Column(columnDefinition = "TEXT")
    private String tags;

    // Photos URLs stockées en JSON
    @Column(columnDefinition = "TEXT")
    private String photos;

    // Speakers stockés en JSON
    @Column(columnDefinition = "TEXT")
    private String speakers;

    // Resources stockées en JSON
    @Column(columnDefinition = "TEXT")
    private String resources;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        updatedAt = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }
}
