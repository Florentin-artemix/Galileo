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

        when(userRepository.findById(9L)).thenReturn(Optional.of(student));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(9L), any())).thenReturn(0L);
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
        User user = User.builder().id(1L).email("user@mapon.cd").role(Role.STUDENT).build();
        CustomUserDetails userDetails = new CustomUserDetails(user);

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

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(5L);
        when(publicationRepository.findById(200L)).thenReturn(Optional.of(pub));
        when(publicationService.isAuthorizedToAccess(pub, userDetails)).thenReturn(true);
        when(documentRepository.findByPublicationId(200L)).thenReturn(List.of(doc));
        when(summaryCacheRepository.findByPublicationIdAndSummaryType(200L, "RAPIDE"))
                .thenReturn(Optional.of(cache));

        AISummaryRequest request = AISummaryRequest.builder()
                .publicationId(200L)
                .summaryType("RAPIDE")
                .build();

        AISummaryResponse response = aiService.summarize(request, userDetails);

        assertNotNull(response);
        assertEquals("Synthèse pré-calculée stockée en base.", response.getContent());
        assertTrue(response.isCached());
        verify(deepSeekAIService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("Anonymous AI chat call must throw ForbiddenException")
    void testAnonymousChatCallThrowsForbiddenException() {
        AIChatRequest request = AIChatRequest.builder()
                .message("Question anonyme")
                .build();

        assertThrows(ForbiddenException.class, () ->
                aiService.chat(request, null)
        );
    }

    @Test
    @DisplayName("AI chat exceeding daily quota must throw BadRequestException")
    void testDailyQuotaExceededThrowsBadRequestException() {
        User user = User.builder().id(5L).email("student5@mapon.cd").role(Role.STUDENT).build();
        CustomUserDetails userDetails = new CustomUserDetails(user);

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(5L), any())).thenReturn(100L); // quota reached

        AIChatRequest request = AIChatRequest.builder()
                .message("Question après dépassement de quota")
                .build();

        assertThrows(com.galileo.common.exception.BadRequestException.class, () ->
                aiService.chat(request, userDetails)
        );
    }

    @Test
    @DisplayName("Accessing another user's conversation must throw ForbiddenException")
    void testCrossUserConversationAccessThrowsForbiddenException() {
        User user = User.builder().id(10L).email("student10@mapon.cd").role(Role.STUDENT).build();
        User otherUser = User.builder().id(99L).email("other@mapon.cd").role(Role.STUDENT).build();
        CustomUserDetails userDetails = new CustomUserDetails(user);

        com.galileo.ai.entity.AIConversation otherConv = com.galileo.ai.entity.AIConversation.builder()
                .id(777L)
                .user(otherUser)
                .title("Conversation privée d'un autre utilisateur")
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(10L), any())).thenReturn(0L);
        when(conversationRepository.findById(777L)).thenReturn(Optional.of(otherConv));

        AIChatRequest request = AIChatRequest.builder()
                .conversationId(777L)
                .message("Tentative d'usurpation de conversation")
                .build();

        assertThrows(ForbiddenException.class, () ->
                aiService.chat(request, userDetails)
        );
    }
}
