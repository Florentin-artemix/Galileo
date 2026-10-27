package com.galileo.ai.repository;

import com.galileo.ai.entity.AIConversationAttachmentChunk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AIConversationAttachmentChunkRepository extends JpaRepository<AIConversationAttachmentChunk, Long> {
    List<AIConversationAttachmentChunk> findByAttachmentIdInOrderByAttachmentIdAscChunkIndexAsc(List<Long> attachmentIds);
}
