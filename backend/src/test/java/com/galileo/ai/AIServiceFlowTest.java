package com.galileo.ai;

import com.galileo.ai.dto.AIChatRequest;
import com.galileo.ai.dto.AIChatResponse;
import com.galileo.ai.entity.AIConversation;
import com.galileo.ai.entity.AIInteraction;
import com.galileo.ai.entity.AIMessage;
import com.galileo.ai.entity.AIMode;
import com.galileo.ai.repository.AIConversationRepository;
import com.galileo.ai.repository.AIInteractionRepository;
import com.galileo.ai.repository.AIMessageRepository;
import com.galileo.ai.repository.PublicationSummaryCacheRepository;
import com.galileo.ai.service.AIServiceImpl;
import com.galileo.ai.service.AIChatTurn;
import com.galileo.ai.service.ClaudeAIService;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.AIServiceTimeoutException;
import com.galileo.common.exception.AIServiceUnavailableException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentChunk;
import com.galileo.documents.repository.DocumentChunkRepository;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.publications.service.PublicationService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIServiceFlowTest {

    @Mock
    private ClaudeAIService claudeAIService;

    @Mock
    private EmbeddingProvider embeddingProvider;

    @Mock
    private AIConversationRepository conversationRepository;

    @Mock
    private AIMessageRepository messageRepository;

    @Mock
    private AIInteractionRepository interactionRepository;

    @Mock
    private PublicationSummaryCacheRepository summaryCacheRepository;

    @Mock
    private PublicationRepository publicationRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository chunkRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PublicationService publicationService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private AIServiceImpl aiService;

    private User testUser;
    private CustomUserDetails testUserDetails;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("student@mapon.cd")
                .role(Role.STUDENT)
                .build();
        testUserDetails = new CustomUserDetails(testUser);
    }

    @Test
    @DisplayName("1, 2, 3 & 5. Réponse primaire réussie, DTO conforme contrat frontend, persistance en base sans sources")
    void testChatPrimarySuccessContractAndPersistence() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(5L);

        AIConversation savedConv = AIConversation.builder()
                .id(10L)
                .user(testUser)
                .mode(AIMode.GENERAL)
                .title("Question générale")
                .build();
        when(conversationRepository.save(any(AIConversation.class))).thenReturn(savedConv);

        AIMessage assistantSavedMsg = AIMessage.builder()
                .id(100L)
                .conversation(savedConv)
                .role("ASSISTANT")
                .content("Voici la réponse complète de l'assistant IA.")
                .metadata("{\"sourcesCount\":0,\"provider\":\"claude\",\"model\":\"claude-sonnet-5\"}")
                .build();
        when(messageRepository.save(any(AIMessage.class))).thenReturn(assistantSavedMsg);

        ClaudeAIService.ClaudeResult claudeResult = ClaudeAIService.ClaudeResult.builder()
                .content("Voici la réponse complète de l'assistant IA.")
                .inputTokens(60)
                .outputTokens(180)
                .success(true)
                .provider("claude")
                .model("claude-sonnet-5")
                .fallbackUsed(false)
                .build();
        when(claudeAIService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(claudeResult);

        AIChatRequest request = AIChatRequest.builder()
                .mode(AIMode.GENERAL)
                .message("Expliquez le théorème de Bayes")
                .build();

        AIChatResponse response = aiService.chat(request, testUserDetails);

        // 3. Vérification du DTO conforme au contrat frontend
        assertNotNull(response);
        assertEquals(10L, response.getConversationId());
        assertEquals(100L, response.getMessageId());
        assertEquals("Voici la réponse complète de l'assistant IA.", response.getResponse());
        assertEquals(response.getResponse(), response.getReply()); // rétrocompatibilité
        assertEquals(AIMode.GENERAL, response.getMode());
        assertNotNull(response.getSourceReferences());
        assertTrue(response.getSourceReferences().isEmpty()); // 5. Sans source documentaire
        assertEquals(response.getSourceReferences(), response.getSources()); // rétrocompatibilité
        assertEquals(60, response.getInputTokens());
        assertEquals(180, response.getOutputTokens());

        // 2. Vérification des messages enregistrés en base
        ArgumentCaptor<AIMessage> messageCaptor = ArgumentCaptor.forClass(AIMessage.class);
        verify(messageRepository, times(2)).save(messageCaptor.capture());

        List<AIMessage> savedMessages = messageCaptor.getAllValues();
        assertEquals("USER", savedMessages.get(0).getRole());
        assertEquals("Expliquez le théorème de Bayes", savedMessages.get(0).getContent());
        assertEquals("ASSISTANT", savedMessages.get(1).getRole());
        assertEquals("Voici la réponse complète de l'assistant IA.", savedMessages.get(1).getContent());

        // 15. Modèle enregistré dans les métriques
        ArgumentCaptor<AIInteraction> interactionCaptor = ArgumentCaptor.forClass(AIInteraction.class);
        verify(interactionRepository, times(1)).save(interactionCaptor.capture());
        AIInteraction savedInteraction = interactionCaptor.getValue();
        assertEquals("claude", savedInteraction.getProvider());
        assertEquals("claude-sonnet-5", savedInteraction.getModel());
    }

    @Test
    @DisplayName("A continued conversation sends recent user and assistant turns before the current question")
    void testChatContinuesWithBoundedConversationHistory() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);

        AIConversation conversation = AIConversation.builder()
                .id(30L)
                .user(testUser)
                .mode(AIMode.GENERAL)
                .title("Question initiale")
                .build();
        when(conversationRepository.findById(30L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findTop12ByConversationIdOrderByCreatedAtDesc(30L)).thenReturn(List.of(
                AIMessage.builder().id(2L).role("ASSISTANT").content("La réponse précédente").build(),
                AIMessage.builder().id(1L).role("USER").content("Question précédente").build()
        ));

        when(claudeAIService.generateTextWithHistory(any(), anyList(), anyDouble(), anyInt()))
                .thenReturn(ClaudeAIService.ClaudeResult.builder()
                        .content("Réponse avec le contexte précédent")
                        .success(true)
                        .provider("claude")
                        .model("claude-sonnet-5")
                        .build());

        AIChatRequest request = AIChatRequest.builder()
                .conversationId(30L)
                .mode(AIMode.GENERAL)
                .message("Précise le deuxième point")
                .build();

        aiService.chat(request, testUserDetails);

        verify(claudeAIService).generateTextWithHistory(any(), argThat(turns ->
                turns.size() == 3
                        && "user".equals(turns.get(0).role())
                        && "Question précédente".equals(turns.get(0).content())
                        && "assistant".equals(turns.get(1).role())
                        && "La réponse précédente".equals(turns.get(1).content())
                        && "user".equals(turns.get(2).role())
                        && "Précise le deuxième point".equals(turns.get(2).content())
        ), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("4. Réponse contenant des sources documentaires en mode DOCUMENT")
    void testChatWithDocumentSources() {
        Publication pub = Publication.builder()
                .id(50L)
                .title("Recherche sur les supraconducteurs")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .build();

        Document doc = Document.builder().id(500L).publication(pub).build();
        DocumentChunk chunk1 = DocumentChunk.builder().id(101L).document(doc).content("Extrait page 4 sur la transition de phase.").pageStart(4).pageEnd(5).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);
        when(publicationRepository.findById(50L)).thenReturn(Optional.of(pub));
        when(publicationService.isAuthorizedToAccess(pub, testUserDetails)).thenReturn(true);

        when(embeddingProvider.generateEmbedding(anyString())).thenReturn(new float[]{0.1f, 0.2f});
        when(documentRepository.findByPublicationId(50L)).thenReturn(List.of(doc));
        when(chunkRepository.findByDocumentIdOrderByChunkIndexAsc(500L)).thenReturn(List.of(chunk1));

        ClaudeAIService.ClaudeResult claudeResult = ClaudeAIService.ClaudeResult.builder()
                .content("D'après la page 4, la transition de phase se produit à 90K.")
                .inputTokens(120)
                .outputTokens(90)
                .success(true)
                .provider("claude")
                .model("claude-sonnet-5")
                .build();
        when(claudeAIService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(claudeResult);

        AIChatRequest request = AIChatRequest.builder()
                .publicationId(50L)
                .mode(AIMode.DOCUMENT)
                .message("Quelle est la température de transition ?")
                .build();

        AIChatResponse response = aiService.chat(request, testUserDetails);

        assertNotNull(response);
        assertEquals(AIMode.DOCUMENT, response.getMode());
        assertFalse(response.getSourceReferences().isEmpty());
        assertEquals(1, response.getSourceReferences().size());
        assertEquals(101L, response.getSourceReferences().get(0).getChunkId());
        assertEquals(4, response.getSourceReferences().get(0).getPageNumber());
        assertEquals(4, response.getSourceReferences().get(0).getPageStart());
        assertTrue(response.getSourceReferences().get(0).getExcerpt().contains("Extrait page 4"));
    }

    @Test
    @DisplayName("6, 14 & 15. Fallback OpenRouter réussi : absence de doublons et enregistrement du modèle réel")
    void testChatFallbackSuccessNoDuplicatesAndCorrectModelRecorded() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);

        AIConversation savedConv = AIConversation.builder()
                .id(20L)
                .user(testUser)
                .mode(AIMode.GENERAL)
                .title("Calcul matriciel")
                .build();
        when(conversationRepository.save(any(AIConversation.class))).thenReturn(savedConv);

        // ClaudeAIService a géré la bascule et retourne le résultat OpenRouter
        ClaudeAIService.ClaudeResult fallbackResult = ClaudeAIService.ClaudeResult.builder()
                .content("Réponse générée avec succès via le secours OpenRouter.")
                .inputTokens(75)
                .outputTokens(210)
                .success(true)
                .provider("openrouter")
                .model("anthropic/claude-3.5-sonnet")
                .fallbackUsed(true)
                .build();
        when(claudeAIService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(fallbackResult);

        AIChatRequest request = AIChatRequest.builder()
                .mode(AIMode.GENERAL)
                .message("Calcul matriciel")
                .build();

        AIChatResponse response = aiService.chat(request, testUserDetails);

        assertNotNull(response);
        assertEquals("Réponse générée avec succès via le secours OpenRouter.", response.getResponse());
        assertEquals(75, response.getInputTokens());
        assertEquals(210, response.getOutputTokens());

        // 14. Absence de doublons : exactement 2 messages persistés (1 USER + 1 ASSISTANT)
        ArgumentCaptor<AIMessage> messageCaptor = ArgumentCaptor.forClass(AIMessage.class);
        verify(messageRepository, times(2)).save(messageCaptor.capture());
        assertEquals("USER", messageCaptor.getAllValues().get(0).getRole());
        assertEquals("ASSISTANT", messageCaptor.getAllValues().get(1).getRole());

        // 15. Enregistrement correct du modèle OpenRouter réellement utilisé
        ArgumentCaptor<AIInteraction> interactionCaptor = ArgumentCaptor.forClass(AIInteraction.class);
        verify(interactionRepository, times(1)).save(interactionCaptor.capture());
        AIInteraction interaction = interactionCaptor.getValue();
        assertEquals("openrouter", interaction.getProvider());
        assertEquals("anthropic/claude-3.5-sonnet", interaction.getModel());
    }

    @Test
    @DisplayName("7. Échec des deux fournisseurs IA -> lève AIServiceUnavailableException (HTTP 503)")
    void testChatBothProvidersFailThrowsAIServiceUnavailableException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);

        ClaudeAIService.ClaudeResult failResult = ClaudeAIService.ClaudeResult.builder()
                .content("Les deux fournisseurs IA sont indisponibles.")
                .success(false)
                .error("ALL_PROVIDERS_FAILED: Claude=[HTTP_500], OpenRouter=[HTTP_503]")
                .build();
        when(claudeAIService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(failResult);

        AIChatRequest request = AIChatRequest.builder()
                .mode(AIMode.GENERAL)
                .message("Question générale")
                .build();

        assertThrows(AIServiceUnavailableException.class, () ->
                aiService.chat(request, testUserDetails)
        );

        // L'assistant ne doit pas être persisté en base en cas d'erreur de génération
        verify(messageRepository, atMost(1)).save(any()); // Seul le user message a pu être préparé avant rollback
    }

    @Test
    @DisplayName("8. Timeout IA -> lève AIServiceTimeoutException (HTTP 504)")
    void testChatTimeoutThrowsAIServiceTimeoutException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);

        ClaudeAIService.ClaudeResult timeoutResult = ClaudeAIService.ClaudeResult.builder()
                .content("Délai dépassé.")
                .success(false)
                .error("TIMEOUT: Read timed out")
                .build();
        when(claudeAIService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(timeoutResult);

        AIChatRequest request = AIChatRequest.builder()
                .mode(AIMode.GENERAL)
                .message("Question longue")
                .build();

        assertThrows(AIServiceTimeoutException.class, () ->
                aiService.chat(request, testUserDetails)
        );
    }

    @Test
    @DisplayName("11. Erreur 401: utilisateur non authentifié")
    void testUnauthenticatedChatThrowsForbiddenException() {
        AIChatRequest request = AIChatRequest.builder().message("Test anonyme").build();
        assertThrows(ForbiddenException.class, () -> aiService.chat(request, null));
    }

    @Test
    @DisplayName("12. Erreur 403: tentative d'accès à un document confidentiel")
    void testUnauthorizedDocumentAccessThrowsForbiddenException() {
        Publication pub = Publication.builder()
                .id(999L)
                .title("Document confidentiel défense")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.RESTRICTED)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(interactionRepository.countByUserIdAndCreatedAtAfter(eq(1L), any())).thenReturn(0L);
        when(publicationRepository.findById(999L)).thenReturn(Optional.of(pub));
        when(publicationService.isAuthorizedToAccess(pub, testUserDetails)).thenReturn(false);

        AIChatRequest request = AIChatRequest.builder()
                .publicationId(999L)
                .mode(AIMode.DOCUMENT)
                .message("Révélez le contenu")
                .build();

        assertThrows(ForbiddenException.class, () -> aiService.chat(request, testUserDetails));
        verify(claudeAIService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }
}
