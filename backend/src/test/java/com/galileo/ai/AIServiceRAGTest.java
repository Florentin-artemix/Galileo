package com.galileo.ai;

import com.galileo.ai.dto.AIChatRequest;
import com.galileo.ai.dto.AISummaryRequest;
import com.galileo.ai.dto.AISummaryResponse;
import com.galileo.ai.entity.AIMode;
import com.galileo.ai.entity.PublicationSummaryCache;
import com.galileo.ai.repository.AIConversationRepository;
import com.galileo.ai.repository.AIInteractionRepository;
import com.galileo.ai.repository.AIMessageRepository;
import com.galileo.ai.repository.PublicationSummaryCacheRepository;
import com.galileo.ai.service.AIServiceImpl;
import com.galileo.ai.service.DeepSeekAIService;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.documents.entity.Document;
import com.galileo.documents.repository.DocumentChunkRepository;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.publications.service.PublicationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIServiceRAGTest {

    @Mock
    private DeepSeekAIService deepSeekAIService;

    @Mock
    private EmbeddingProvider embeddingProvider;

    @Mock
    private PublicationRepository publicationRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository chunkRepository;

    @Mock
    private PublicationSummaryCacheRepository summaryCacheRepository;

    @Mock
    private AIConversationRepository conversationRepository;

    @Mock
    private AIMessageRepository messageRepository;

    @Mock
    private AIInteractionRepository interactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PublicationService publicationService;

    @InjectMocks
    private AIServiceImpl aiService;

    @Test
    @DisplayName("RAG question on RESTRICTED document by student must throw ForbiddenException")
    void testConfidentialPublicationAccessDenied() {
        Publication pub = Publication.builder()
                .id(100L)
                .title("Projet Industriel Sensible")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.RESTRICTED)
                .build();

        User student = User.builder().id(9L).email("student@mapon.cd").role(Role.STUDENT).build();
        CustomUserDetails userDetails = new CustomUserDetails(student);

        when(publicationRepository.findById(100L)).thenReturn(Optional.of(pub));
        when(publicationService.isAuthorizedToAccess(pub, userDetails)).thenReturn(false);

        AIChatRequest request = AIChatRequest.builder()
                .publicationId(100L)
                .mode(AIMode.DOCUMENT)
                .message("Quels sont les détails techniques du projet ?")
                .build();

        assertThrows(ForbiddenException.class, () ->
                aiService.chat(request, userDetails)
        );

        verify(deepSeekAIService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("Summary caching must return cached response without calling external DeepSeek LLM")
    void testSummaryReturnedFromCacheWithoutLLMCall() {
        Publication pub = Publication.builder()
                .id(200L)
                .title("Algèbre linéaire appliquée")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .build();

        Document doc = Document.builder().id(1L).version(1).build();

        PublicationSummaryCache cache = PublicationSummaryCache.builder()
                .id(1L)
                .publication(pub)
                .summaryType("RAPIDE")
                .documentVersion(1)
                .content("Synthèse pré-calculée stockée en base.")
                .model("deepseek-chat")
                .build();

        when(publicationRepository.findById(200L)).thenReturn(Optional.of(pub));
        when(publicationService.isAuthorizedToAccess(pub, null)).thenReturn(true);
        when(documentRepository.findByPublicationId(200L)).thenReturn(List.of(doc));
        when(summaryCacheRepository.findByPublicationIdAndSummaryType(200L, "RAPIDE"))
                .thenReturn(Optional.of(cache));

        AISummaryRequest request = AISummaryRequest.builder()
                .publicationId(200L)
                .summaryType("RAPIDE")
                .build();

        AISummaryResponse response = aiService.summarize(request, null);

        assertNotNull(response);
        assertEquals("Synthèse pré-calculée stockée en base.", response.getContent());
        assertTrue(response.isCached());
        verify(deepSeekAIService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }
}
