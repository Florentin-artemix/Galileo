package com.galileo.recommendations.entity;

import com.galileo.auth.entity.User;
import com.galileo.publications.entity.Publication;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reading_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publication_id", nullable = false)
    private Publication publication;

    @Column(name = "last_page")
    private Integer lastPage;

    @Column(name = "progress")
    @Builder.Default
    private Float progress = 0.0f;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @PrePersist
    protected void onCreate() {
        if (this.readAt == null) {
            this.readAt = LocalDateTime.now();
        }
        if (this.progress == null) {
            this.progress = 0.0f;
        }
    }
}
