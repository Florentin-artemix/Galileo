package com.galileo.documents.entity;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_embeddings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"chunk_id", "model"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chunk_id", nullable = false)
    private DocumentChunk chunk;

    @Column(name = "embedding", columnDefinition = "vector(1024)")
    private PGvector embedding;

    @Column(name = "model", nullable = false, length = 100)
    @Builder.Default
    private String model = "text-embedding-v4";

    @Column(name = "provider", nullable = false, length = 100)
    @Builder.Default
    private String provider = "qwen-cloud";

    @Column(name = "dimension", nullable = false)
    @Builder.Default
    private Integer dimension = 1024;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.model == null) {
            this.model = "text-embedding-v4";
        }
        if (this.provider == null) {
            this.provider = "qwen-cloud";
        }
        if (this.dimension == null) {
            this.dimension = 1024;
        }
    }
}
