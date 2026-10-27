package com.galileo.ai.repository;

import com.galileo.ai.entity.AIConversationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AIConversationAttachmentRepository extends JpaRepository<AIConversationAttachment, Long> {
    List<AIConversationAttachment> findByConversationIdAndUserIdOrderByCreatedAtAsc(Long conversationId, Long userId);
    Optional<AIConversationAttachment> findByIdAndConversationIdAndUserId(Long id, Long conversationId, Long userId);
    long countByConversationIdAndUserId(Long conversationId, Long userId);
}
