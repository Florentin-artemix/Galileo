package com.galileo.ai.entity;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_conversation_attachment_chunks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"attachment_id", "chunk_index"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIConversationAttachmentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id", nullable = false)
    private AIConversationAttachment attachment;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "embedding", columnDefinition = "vector(1024)")
    private PGvector embedding;

    @Column(name = "embedding_model", length = 100)
    private String embeddingModel;
}
