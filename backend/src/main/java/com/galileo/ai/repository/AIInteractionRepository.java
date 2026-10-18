package com.galileo.ai.repository;

import com.galileo.ai.entity.AIInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AIInteractionRepository extends JpaRepository<AIInteraction, Long> {
    List<AIInteraction> findByUserId(Long userId);
    List<AIInteraction> findByInteractionType(String interactionType);
    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime date);
}
