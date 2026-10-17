package com.galileo.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.ai.dto.*;
import com.galileo.ai.entity.*;
import com.galileo.ai.repository.AIConversationRepository;
import com.galileo.ai.repository.AIInteractionRepository;
import com.galileo.ai.repository.AIMessageRepository;
import com.galileo.ai.repository.PublicationSummaryCacheRepository;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentChunk;
import com.galileo.documents.repository.DocumentChunkRepository;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.publications.service.PublicationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIService {

    private final DeepSeekAIService deepSeekAIService;
    private final EmbeddingProvider embeddingProvider;
    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final AIInteractionRepository interactionRepository;
    private final PublicationSummaryCacheRepository summaryCacheRepository;
    private final PublicationRepository publicationRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final UserRepository userRepository;
    private final PublicationService publicationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PersistenceContext
    private EntityManager entityManager;

    private static final int DAILY_QUOTA_PER_USER = 100;

    @Override
    @Transactional
    public AIChatResponse chat(AIChatRequest request, CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        // Contrôle du quota d'utilisation journalier
        if (user != null && user.getRole() != Role.ADMIN && user.getRole() != Role.STAFF) {
            checkDailyQuota(user.getId());
        }

        AIMode mode = request.getMode() != null ? request.getMode() : AIMode.GENERAL;
        Publication publication = null;
        if (request.getPublicationId() != null) {
            publication = publicationRepository.findById(request.getPublicationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", request.getPublicationId()));

            // Vérification stricte des droits d'accès au document pour le RAG
            if (!publicationService.isAuthorizedToAccess(publication, userDetails)) {
                throw new ForbiddenException("Vous n'avez pas l'autorisation d'interroger ce document");
            }
            mode = AIMode.DOCUMENT;
        }

        // Récupération ou création de la conversation
        AIConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation IA", "id", request.getConversationId()));
            if (user != null && !conversation.getUser().getId().equals(user.getId())) {
                throw new ForbiddenException("Cette conversation ne vous appartient pas");
            }
        } else if (user != null) {
            String title = request.getMessage().length() > 60
                    ? request.getMessage().substring(0, 57) + "..."
                    : request.getMessage();
            conversation = AIConversation.builder()
                    .user(user)
                    .publication(publication)
                    .mode(mode)
                    .title(title)
                    .build();
            conversation = conversationRepository.save(conversation);
        } else {
            conversation = null;
        }

        // Sauvegarde du message utilisateur
        if (conversation != null) {
            messageRepository.save(AIMessage.builder()
                    .conversation(conversation)
                    .role("USER")
                    .content(request.getMessage())
                    .build());
        }

        // RAG Documentaire si mode DOCUMENT
        List<AIChatResponse.SourceCitation> sources = new ArrayList<>();
        String systemPrompt = buildSystemPrompt(mode, publication);
        String finalUserPrompt = request.getMessage();

        if (mode == AIMode.DOCUMENT && publication != null) {
            List<RetrievedChunk> relevantChunks = retrieveRelevantChunks(publication.getId(), request.getMessage(), userDetails);

            if (!relevantChunks.isEmpty()) {
                StringBuilder ragContext = new StringBuilder();
                ragContext.append("Extraits pertinents du document académique « ")
                        .append(publication.getTitle())
                        .append(" » (ne pas inventer d'informations extérieures) :\n\n");

                for (RetrievedChunk rc : relevantChunks) {
                    ragContext.append(String.format("[Source: Page %d-%d] : %s\n\n",
                            rc.pageStart != null ? rc.pageStart : 1,
                            rc.pageEnd != null ? rc.pageEnd : 1,
                            rc.content));

                    sources.add(AIChatResponse.SourceCitation.builder()
                            .chunkId(rc.chunkId)
                            .pageStart(rc.pageStart)
                            .pageEnd(rc.pageEnd)
                            .excerpt(rc.content.length() > 200 ? rc.content.substring(0, 197) + "..." : rc.content)
                            .similarity(rc.similarity)
                            .build());
                }

                ragContext.append("\nQuestion de l'utilisateur : ").append(request.getMessage())
                        .append("\n\nConsigne : Rédige une réponse précise avec citations explicites des pages.");
                finalUserPrompt = ragContext.toString();
            }
        }

        long startTime = System.currentTimeMillis();
        DeepSeekAIService.DeepSeekResult result = deepSeekAIService.generateText(systemPrompt, finalUserPrompt, 0.3, 2048);
        long duration = System.currentTimeMillis() - startTime;

        // Observabilité IA (DeepSeek LLM)
        recordLLMInteraction(user, "chat_" + mode.name().toLowerCase(),
                result.getInputTokens(), result.getOutputTokens(), (int) duration);

        // Sauvegarde de la réponse de l'assistant
        AIMessage assistantMsg = null;
        if (conversation != null) {
            String metadataJson = null;
            try {
                metadataJson = objectMapper.writeValueAsString(Map.of("sourcesCount", sources.size()));
            } catch (Exception ignored) {}

            assistantMsg = messageRepository.save(AIMessage.builder()
                    .conversation(conversation)
                    .role("ASSISTANT")
                    .content(result.getContent())
                    .metadata(metadataJson)
                    .build());

            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
        }

        return AIChatResponse.builder()
                .conversationId(conversation != null ? conversation.getId() : null)
                .messageId(assistantMsg != null ? assistantMsg.getId() : null)
                .reply(result.getContent())
                .mode(mode)
                .sources(sources)
                .build();
    }

    @Override
    @Transactional
    public AISummaryResponse summarize(AISummaryRequest request, CustomUserDetails userDetails) {
        Publication publication = publicationRepository.findById(request.getPublicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", request.getPublicationId()));

        if (!publicationService.isAuthorizedToAccess(publication, userDetails)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette publication");
        }

        String summaryType = request.getSummaryType() != null ? request.getSummaryType().toUpperCase() : "RAPIDE";

        // Vérification du cache de synthèse
        Optional<PublicationSummaryCache> cachedOpt = summaryCacheRepository
                .findByPublicationIdAndSummaryType(publication.getId(), summaryType);

        List<Document> docs = documentRepository.findByPublicationId(publication.getId());
        int currentDocVersion = docs.isEmpty() ? 1 : (docs.get(0).getVersion() != null ? docs.get(0).getVersion() : 1);

        if (cachedOpt.isPresent()) {
            PublicationSummaryCache cached = cachedOpt.get();
            if (cached.getDocumentVersion() >= currentDocVersion) {
                return AISummaryResponse.builder()
                        .publicationId(publication.getId())
                        .summaryType(summaryType)
                        .content(cached.getContent())
                        .cached(true)
                        .model(cached.getModel())
                        .build();
            }
        }

        // Construction du contenu à synthétiser
        String documentContent = "";
        if (!docs.isEmpty() && docs.get(0).getExtractedText() != null && !docs.get(0).getExtractedText().isEmpty()) {
            String full = docs.get(0).getExtractedText();
            documentContent = full.length() > 8000 ? full.substring(0, 8000) : full;
        } else {
            documentContent = publication.getTitle() + "\n" + (publication.getAbstractText() != null ? publication.getAbstractText() : "");
        }

        String instructions = switch (summaryType) {
            case "STRUCTURE" -> "Génère un résumé structuré selon les sections académiques : Problématique, Méthodologie, Résultats majeurs, Discussion et Limites.";
            case "PEDAGOGIQUE" -> "Génère une synthèse pédagogique vulgarisée accessible à un étudiant débutant, avec définitions des concepts clés et exemples explicatifs.";
            default -> "Génère une synthèse concise en 4-5 points clés percutants (Objectif, Méthode, Résultat clé, Conclusion).";
        };

        String systemPrompt = "Tu es un expert en synthèse académique pour Galileo. " + instructions;
        String userPrompt = "Document à synthétiser :\nTitre : " + publication.getTitle() + "\nContenu :\n" + documentContent;

        long startTime = System.currentTimeMillis();
        DeepSeekAIService.DeepSeekResult result = deepSeekAIService.generateText(systemPrompt, userPrompt, 0.2, 1500);
        long duration = System.currentTimeMillis() - startTime;

        User currentUser = userDetails != null ? userRepository.findById(userDetails.getId()).orElse(null) : null;
        recordLLMInteraction(currentUser, "summarize_" + summaryType.toLowerCase(),
                result.getInputTokens(), result.getOutputTokens(), (int) duration);

        // Sauvegarde ou mise à jour du cache
        PublicationSummaryCache cache = cachedOpt.orElseGet(() -> PublicationSummaryCache.builder()
                .publication(publication)
                .summaryType(summaryType)
                .build());
        cache.setContent(result.getContent());
        cache.setModel("deepseek-chat");
        cache.setDocumentVersion(currentDocVersion);
        summaryCacheRepository.save(cache);

        return AISummaryResponse.builder()
                .publicationId(publication.getId())
                .summaryType(summaryType)
                .content(result.getContent())
                .cached(false)
                .model("deepseek-chat")
                .build();
    }

    @Override
    @Transactional
    public String explainPassage(AIExplainRequest request, CustomUserDetails userDetails) {
        String level = request.getLevel() != null ? request.getLevel().toUpperCase() : "INTERMEDIAIRE";

        String systemPrompt = switch (level) {
            case "SIMPLIFIE" -> "Tu es un vulgarisateur scientifique. Explique le passage suivant avec des mots simples, des analogies de la vie quotidienne et sans jargon inutile.";
            case "AVANCE" -> "Tu es un chercheur senior. Analyse ce passage de manière approfondie, en discutant les fondements théoriques, la rigueur méthodologique et les implications académiques.";
            default -> "Tu es un enseignant universitaire. Explique ce passage de manière claire, didactique et structurée pour un étudiant de premier cycle.";
        };

        String userPrompt = "Passage à expliquer :\n« " + request.getPassage() + " »";

        long startTime = System.currentTimeMillis();
        DeepSeekAIService.DeepSeekResult result = deepSeekAIService.generateText(systemPrompt, userPrompt, 0.4, 1200);
        long duration = System.currentTimeMillis() - startTime;

        User currentUser = userDetails != null ? userRepository.findById(userDetails.getId()).orElse(null) : null;
        recordLLMInteraction(currentUser, "explain_" + level.toLowerCase(),
                result.getInputTokens(), result.getOutputTokens(), (int) duration);

        return result.getContent();
    }

    @Override
    @Transactional
    public String comparePublications(AICompareRequest request, CustomUserDetails userDetails) {
        if (request.getPublicationIds() == null || request.getPublicationIds().size() < 2) {
            throw new BadRequestException("Au moins 2 publications sont requises pour une comparaison");
        }

        StringBuilder comparisonContext = new StringBuilder();
        comparisonContext.append("Voici les publications à comparer :\n\n");

        int count = 1;
        for (Long pubId : request.getPublicationIds()) {
            Publication p = publicationRepository.findById(pubId)
                    .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", pubId));

            if (!publicationService.isAuthorizedToAccess(p, userDetails)) {
                throw new ForbiddenException("Accès non autorisé à la publication #" + pubId);
            }

            comparisonContext.append(String.format("### Travail %d : « %s »\n", count++, p.getTitle()));
            comparisonContext.append("- Domaine : ").append(p.getDomain() != null ? p.getDomain().getName() : "").append("\n");
            comparisonContext.append("- Résumé : ").append(p.getAbstractText()).append("\n");
            if (p.getMethodology() != null) {
                comparisonContext.append("- Méthodologie : ").append(p.getMethodology()).append("\n");
            }
            comparisonContext.append("\n");
        }

        List<String> criteria = request.getCriteria() != null && !request.getCriteria().isEmpty()
                ? request.getCriteria()
                : List.of("Problématique", "Approche méthodologique", "Résultats et innovations", "Limites respectives");

        String systemPrompt = "Tu es un chercheur expert chargé d'une analyse comparative critique rigoureuse pour Galileo.";
        String userPrompt = comparisonContext.toString() +
                "\nCritères de comparaison demandés : " + String.join(", ", criteria) +
                "\n\nProduis un tableau comparatif Markdown synthétique suivi d'une analyse comparative rédigée.";

        long startTime = System.currentTimeMillis();
        DeepSeekAIService.DeepSeekResult result = deepSeekAIService.generateText(systemPrompt, userPrompt, 0.3, 2500);
        long duration = System.currentTimeMillis() - startTime;

        User currentUser = userDetails != null ? userRepository.findById(userDetails.getId()).orElse(null) : null;
        recordLLMInteraction(currentUser, "compare_publications",
                result.getInputTokens(), result.getOutputTokens(), (int) duration);

        return result.getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AIConversationDTO> getUserConversations(Long userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toConversationDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AIMessageDTO> getConversationMessages(Long conversationId, Long userId) {
        AIConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conv.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Accès non autorisé à cette conversation");
        }

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(this::toMessageDTO)
                .toList();
    }

    @Override
    @Transactional
    public AIConversationDTO createConversation(Long userId, Long publicationId, AIMode mode, String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        Publication publication = null;
        if (publicationId != null) {
            publication = publicationRepository.findById(publicationId).orElse(null);
        }

        AIConversation conversation = AIConversation.builder()
                .user(user)
                .publication(publication)
                .mode(mode != null ? mode : AIMode.GENERAL)
                .title(title != null && !title.trim().isEmpty() ? title.trim() : "Nouvelle discussion")
                .build();

        conversation = conversationRepository.save(conversation);
        return toConversationDTO(conversation);
    }

    @Override
    @Transactional
    public void deleteConversation(Long conversationId, Long userId) {
        AIConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conv.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Vous ne pouvez supprimer que vos propres conversations");
        }

        conversationRepository.delete(conv);
    }

    private List<RetrievedChunk> retrieveRelevantChunks(Long publicationId, String question, CustomUserDetails user) {
        List<RetrievedChunk> chunks = new ArrayList<>();
        float[] qVector = embeddingProvider.generateEmbedding(question);

        try {
            String vectorStr = Arrays.toString(qVector);
            String nativeSql = """
                SELECT dc.id, dc.content, dc.page_start, dc.page_end, (de.embedding <=> cast(:vec as vector)) as dist
                FROM document_embeddings de
                JOIN document_chunks dc ON de.chunk_id = dc.id
                JOIN documents d ON dc.document_id = d.id
                WHERE d.publication_id = :pubId
                ORDER BY dist ASC
                LIMIT 4
            """;

            Query q = entityManager.createNativeQuery(nativeSql);
            q.setParameter("vec", vectorStr);
            q.setParameter("pubId", publicationId);

            @SuppressWarnings("unchecked")
            List<Object[]> rows = q.getResultList();

            for (Object[] row : rows) {
                Long chunkId = ((Number) row[0]).longValue();
                String content = (String) row[1];
                Integer pageStart = row[2] != null ? ((Number) row[2]).intValue() : null;
                Integer pageEnd = row[3] != null ? ((Number) row[3]).intValue() : null;
                Double distance = row[4] != null ? ((Number) row[4]).doubleValue() : 0.0;
                double similarity = Math.max(0.0, 1.0 - distance);

                chunks.add(new RetrievedChunk(chunkId, content, pageStart, pageEnd, similarity));
            }
        } catch (Exception e) {
            log.warn("Recherche vectorielle native pgvector non disponible, fallback sur les premiers passages : {}", e.getMessage());
            List<Document> docs = documentRepository.findByPublicationId(publicationId);
            if (!docs.isEmpty()) {
                List<DocumentChunk> docChunks = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(docs.get(0).getId());
                docChunks.stream().limit(4).forEach(dc -> chunks.add(
                        new RetrievedChunk(dc.getId(), dc.getContent(), dc.getPageStart(), dc.getPageEnd(), 0.85)
                ));
            }
        }

        return chunks;
    }

    private String buildSystemPrompt(AIMode mode, Publication pub) {
        String base = "Tu es l'assistant d'intelligence artificielle de la plateforme académique Galileo. ";
        return switch (mode) {
            case DOCUMENT -> base + "Tu assistes l'utilisateur dans l'analyse critique et la compréhension d'un travail académique précis. Réponds avec rigueur et cite expressément les pages.";
            case RESEARCH -> base + "Tu guides les chercheurs dans la formulation de problématiques, la revue de littérature, le choix des méthodologies et la comparaison des travaux.";
            case LEARNING -> base + "Tu es un tuteur pédagogique bienveillant. Tu découpes les explications de manière claire, progressive et structurée, adaptée aux étudiants.";
            case GENERAL -> base + "Tu réponds à toute question académique ou scientifique générale de façon claire, neutre et documentée.";
        };
    }

    private void checkDailyQuota(Long userId) {
        List<AIInteraction> interactions = interactionRepository.findByUserId(userId);
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        long countToday = interactions.stream()
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isAfter(todayStart))
                .count();

        if (countToday >= DAILY_QUOTA_PER_USER) {
            throw new BadRequestException("Quota journalier d'utilisation de l'IA atteint (" + DAILY_QUOTA_PER_USER + " requêtes/jour). Réessayez demain.");
        }
    }

    private void recordLLMInteraction(User user, String functionName, int inTokens, int outTokens, int durationMs) {
        try {
            AIInteraction interaction = AIInteraction.builder()
                    .user(user)
                    .interactionType("LLM")
                    .functionName(functionName)
                    .provider("deepseek")
                    .model("deepseek-chat")
                    .inputTokens(inTokens)
                    .outputTokens(outTokens)
                    .dimension(null)
                    .numberOfChunks(null)
                    .estimatedCost(BigDecimal.valueOf((inTokens * 0.00000014) + (outTokens * 0.00000028)))
                    .durationMs(durationMs)
                    .build();
            interactionRepository.save(interaction);
        } catch (Exception e) {
            log.warn("Impossible d'enregistrer la métrique LLM : {}", e.getMessage());
        }
    }

    private AIConversationDTO toConversationDTO(AIConversation c) {
        return AIConversationDTO.builder()
                .id(c.getId())
                .userId(c.getUser().getId())
                .publicationId(c.getPublication() != null ? c.getPublication().getId() : null)
                .publicationTitle(c.getPublication() != null ? c.getPublication().getTitle() : null)
                .mode(c.getMode())
                .title(c.getTitle())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private AIMessageDTO toMessageDTO(AIMessage m) {
        return AIMessageDTO.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .role(m.getRole())
                .content(m.getContent())
                .metadata(m.getMetadata())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private record RetrievedChunk(Long chunkId, String content, Integer pageStart, Integer pageEnd, Double similarity) {}
}
