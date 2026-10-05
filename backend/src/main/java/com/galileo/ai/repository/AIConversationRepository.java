package com.galileo.ai.repository;

import com.galileo.ai.entity.AIConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, Long> {
    List<AIConversation> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<AIConversation> findByPublicationIdAndUserId(Long publicationId, Long userId);
}
