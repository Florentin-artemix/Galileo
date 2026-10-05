package com.galileo.publications.entity;

import com.galileo.users.entity.Institution;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "publications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "slug", nullable = false, unique = true, length = 500)
    private String slug;

    @Column(name = "abstract_text", columnDefinition = "TEXT")
    private String abstractText;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private PublicationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private PublicationStatus status = PublicationStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false, length = 50)
    @Builder.Default
    private AccessLevel accessLevel = AccessLevel.PUBLIC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "domain_id")
    private Domain domain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;

    @Column(name = "language", length = 10)
    @Builder.Default
    private String language = "fr";

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "academic_year", length = 20)
    private String academicYear;

    @Column(name = "supervisor", length = 200)
    private String supervisor;

    @Column(name = "methodology", columnDefinition = "TEXT")
    private String methodology;

    @Column(name = "doi", length = 100)
    private String doi;

    @Column(name = "license", length = 100)
    private String license;

    @Column(name = "references_text", columnDefinition = "TEXT")
    private String referencesText;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "download_count")
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = PublicationStatus.DRAFT;
        }
        if (this.accessLevel == null) {
            this.accessLevel = AccessLevel.PUBLIC;
        }
        if (this.language == null) {
            this.language = "fr";
        }
        if (this.viewCount == null) {
            this.viewCount = 0;
        }
        if (this.downloadCount == null) {
            this.downloadCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
