package com.galileo.ai.service;

import com.galileo.ai.dto.*;
import com.galileo.ai.entity.AIMode;
import com.galileo.auth.security.CustomUserDetails;

import java.util.List;

public interface AIService {

    AIChatResponse chat(AIChatRequest request, CustomUserDetails userDetails);

    AISummaryResponse summarize(AISummaryRequest request, CustomUserDetails userDetails);

    String explainPassage(AIExplainRequest request, CustomUserDetails userDetails);

    String comparePublications(AICompareRequest request, CustomUserDetails userDetails);

    List<AIConversationDTO> getUserConversations(Long userId);

    List<AIMessageDTO> getConversationMessages(Long conversationId, Long userId);

    AIConversationDTO createConversation(Long userId, Long publicationId, AIMode mode, String title);

    void deleteConversation(Long conversationId, Long userId);
}
