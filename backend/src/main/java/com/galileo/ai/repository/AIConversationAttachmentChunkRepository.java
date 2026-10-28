package com.galileo.ai.repository;

import com.galileo.ai.entity.AIConversationAttachmentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface AIConversationAttachmentChunkRepository extends JpaRepository<AIConversationAttachmentChunk, Long> {
    List<AIConversationAttachmentChunk> findByAttachmentIdInOrderByAttachmentIdAscChunkIndexAsc(List<Long> attachmentIds);

    @Modifying
    @Transactional
    @Query(value = "UPDATE ai_conversation_attachment_chunks SET embedding = cast(:embedding as vector), embedding_model = :model WHERE id = :id", nativeQuery = true)
    void updateChunkEmbeddingVector(@Param("id") Long id, @Param("embedding") String embedding, @Param("model") String model);
}
