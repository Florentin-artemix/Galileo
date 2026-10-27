package com.galileo.ai.service;

import com.galileo.ai.dto.AIConversationAttachmentDTO;
import com.galileo.ai.entity.AIConversation;
import com.galileo.ai.entity.AIConversationAttachment;
import com.galileo.ai.entity.AIConversationAttachmentChunk;
import com.galileo.ai.repository.AIConversationAttachmentChunkRepository;
import com.galileo.ai.repository.AIConversationAttachmentRepository;
import com.galileo.ai.repository.AIConversationRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.service.DocumentService;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.pgvector.PGvector;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIConversationAttachmentService {

    private static final long MAX_UPLOAD_BYTES = 20L * 1024 * 1024;
    private static final int MAX_PAGES = 500;
    private static final int MAX_EXTRACTED_CHARACTERS = 500_000;
    private static final int MAX_ATTACHMENTS_PER_CONVERSATION = 5;
    private static final int CHUNK_SIZE = 1_200;
    private static final int CHUNK_OVERLAP = 180;
    private static final int MAX_CONTEXT_CHUNKS = 6;
    private static final int MAX_CONTEXT_CHARACTERS = 9_000;
    private static final Pattern TOKEN_PATTERN = Pattern.compile("[\\p{L}\\p{N}]{2,}");
    private static final Set<String> STOP_WORDS = Set.of(
            "alors", "avec", "avoir", "cette", "dans", "deja", "des", "donc", "elle", "elles", "est", "etre",
            "faire", "fait", "ici", "ils", "leur", "mais", "meme", "notre", "nous", "par", "pas", "peut",
            "plus", "pour", "quel", "quelle", "quelles", "quels", "que", "qui", "quoi", "sans", "sera",
            "ses", "son", "sont", "sous", "sur", "tous", "tout", "tres", "une", "vos", "votre", "vous",
            "the", "and", "for", "from", "that", "this", "with", "what", "when", "where", "which", "who",
            "why", "how", "does", "can", "about", "into", "are", "was", "were", "have", "has", "not"
    );

    private final AIConversationRepository conversationRepository;
    private final AIConversationAttachmentRepository attachmentRepository;
    private final AIConversationAttachmentChunkRepository chunkRepository;
    private final DocumentService documentService;
    private final EmbeddingProvider embeddingProvider;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public AIConversationAttachmentDTO upload(Long conversationId, MultipartFile file, CustomUserDetails user) {
        AIConversation conversation = getOwnedConversation(conversationId, user);
        if (user.getRole() != null && "VIEWER".equals(user.getRole().name())) {
            throw new ForbiddenException("Le rôle Visiteur ne peut pas joindre ni interroger le contenu intégral d'un PDF");
        }
        if (attachmentRepository.countByConversationIdAndUserId(conversationId, user.getId()) >= MAX_ATTACHMENTS_PER_CONVERSATION) {
            throw new BadRequestException("Une conversation peut contenir au maximum 5 PDF joints");
        }
        if (file == null || file.getSize() > MAX_UPLOAD_BYTES) {
            throw new BadRequestException("Le PDF joint ne peut pas dépasser 20 Mo");
        }

        documentService.validatePdfFile(file);
        Extraction extraction = extract(file);
        String rawName = Optional.ofNullable(file.getOriginalFilename()).orElse("document.pdf");
        String fileName = rawName.replaceAll("[^a-zA-Z0-9._-]", "_");

        AIConversationAttachment attachment = attachmentRepository.save(AIConversationAttachment.builder()
                .conversation(conversation)
                .user(conversation.getUser())
                .fileName(fileName)
                .pageCount(extraction.pageCount())
                .extractedCharacters(extraction.characterCount())
                .build());

        conversation.setMode(com.galileo.ai.entity.AIMode.DOCUMENT);
        conversationRepository.save(conversation);

        List<AIConversationAttachmentChunk> chunks = buildChunks(attachment, extraction.pages());
        if (chunks.isEmpty()) {
            throw new BadRequestException("Aucun texte exploitable n'a été extrait du PDF joint.");
        }
        indexEmbeddings(chunks);
        chunkRepository.saveAll(chunks);
        return toDTO(attachment);
    }

    @Transactional(readOnly = true)
    public List<AIConversationAttachmentDTO> list(Long conversationId, CustomUserDetails user) {
        getOwnedConversation(conversationId, user);
        return attachmentRepository.findByConversationIdAndUserIdOrderByCreatedAtAsc(conversationId, user.getId())
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public void delete(Long conversationId, Long attachmentId, CustomUserDetails user) {
        getOwnedConversation(conversationId, user);
        AIConversationAttachment attachment = attachmentRepository
                .findByIdAndConversationIdAndUserId(attachmentId, conversationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pièce jointe", "id", attachmentId));
        attachmentRepository.delete(attachment);
    }

    @Transactional(readOnly = true)
    public boolean hasAttachments(Long conversationId, Long userId) {
        return attachmentRepository.countByConversationIdAndUserId(conversationId, userId) > 0;
    }

    @Transactional(readOnly = true)
    public List<RetrievedAttachmentChunk> retrieveRelevantChunks(Long conversationId, Long userId, String question) {
        List<AIConversationAttachment> attachments = attachmentRepository
                .findByConversationIdAndUserIdOrderByCreatedAtAsc(conversationId, userId);
        if (attachments.isEmpty()) return List.of();

        List<Long> attachmentIds = attachments.stream().map(AIConversationAttachment::getId).toList();
        List<AIConversationAttachmentChunk> chunks = chunkRepository
                .findByAttachmentIdInOrderByAttachmentIdAscChunkIndexAsc(attachmentIds);
        List<RetrievedAttachmentChunk> semanticChunks = retrieveSemantically(conversationId, userId, question);
        if (!semanticChunks.isEmpty()) return semanticChunks;

        List<String> terms = tokenize(question);
        if (terms.isEmpty()) return List.of();

        List<ScoredChunk> ranked = chunks.stream()
                .map(chunk -> score(chunk, terms))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator.comparingDouble(ScoredChunk::score).reversed())
                .toList();

        List<RetrievedAttachmentChunk> selected = new ArrayList<>();
        int contextCharacters = 0;
        for (ScoredChunk scored : ranked) {
            if (selected.size() >= MAX_CONTEXT_CHUNKS || contextCharacters >= MAX_CONTEXT_CHARACTERS) break;
            AIConversationAttachmentChunk chunk = scored.chunk();
            int available = MAX_CONTEXT_CHARACTERS - contextCharacters;
            String content = chunk.getContent().length() > available
                    ? chunk.getContent().substring(0, available)
                    : chunk.getContent();
            if (content.isBlank()) continue;
            selected.add(new RetrievedAttachmentChunk(
                    chunk.getId(),
                    chunk.getAttachment().getId(),
                    chunk.getAttachment().getFileName(),
                    chunk.getPageNumber(),
                    content,
                    scored.score()));
            contextCharacters += content.length();
        }
        return selected;
    }

    private List<RetrievedAttachmentChunk> retrieveSemantically(Long conversationId, Long userId, String question) {
        try {
            float[] queryEmbedding = embeddingProvider.generateEmbedding(question);
            if (queryEmbedding == null || queryEmbedding.length != embeddingProvider.getDimension()) return List.of();
            Query query = entityManager.createNativeQuery("""
                    SELECT c.id, c.attachment_id, a.file_name, c.page_number, c.content,
                           1 - (c.embedding <=> cast(:vector as vector)) AS similarity
                    FROM ai_conversation_attachment_chunks c
                    JOIN ai_conversation_attachments a ON a.id = c.attachment_id
                    WHERE a.conversation_id = :conversationId
                      AND a.user_id = :userId
                      AND c.embedding IS NOT NULL
                      AND c.embedding_model = :model
                    ORDER BY c.embedding <=> cast(:vector as vector)
                    LIMIT :limit
                    """);
            query.setParameter("vector", Arrays.toString(queryEmbedding));
            query.setParameter("conversationId", conversationId);
            query.setParameter("userId", userId);
            query.setParameter("model", embeddingProvider.getModelName());
            query.setParameter("limit", MAX_CONTEXT_CHUNKS);

            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();
            List<RetrievedAttachmentChunk> retrieved = new ArrayList<>();
            int contextCharacters = 0;
            for (Object[] row : rows) {
                double similarity = row[5] != null ? ((Number) row[5]).doubleValue() : 0;
                if (similarity < 0.3 || contextCharacters >= MAX_CONTEXT_CHARACTERS) continue;
                String content = (String) row[4];
                int remaining = MAX_CONTEXT_CHARACTERS - contextCharacters;
                if (content.length() > remaining) content = content.substring(0, remaining);
                if (content.isBlank()) continue;
                retrieved.add(new RetrievedAttachmentChunk(
                        ((Number) row[0]).longValue(),
                        ((Number) row[1]).longValue(),
                        (String) row[2],
                        ((Number) row[3]).intValue(),
                        content,
                        similarity));
                contextCharacters += content.length();
            }
            return retrieved;
        } catch (Exception e) {
            log.info("Recherche sémantique des PDF joints indisponible, repli lexical: {}", e.getMessage());
            return List.of();
        }
    }

    private void indexEmbeddings(List<AIConversationAttachmentChunk> chunks) {
        try {
            for (int start = 0; start < chunks.size(); start += 64) {
                List<AIConversationAttachmentChunk> batch = chunks.subList(start, Math.min(start + 64, chunks.size()));
                List<float[]> vectors = embeddingProvider.generateEmbeddings(batch.stream()
                        .map(AIConversationAttachmentChunk::getContent).toList());
                if (vectors == null || vectors.size() != batch.size()) {
                    throw new IllegalStateException("Réponse incomplète du fournisseur d'embeddings");
                }
                for (int i = 0; i < batch.size(); i++) {
                    float[] vector = vectors.get(i);
                    if (vector == null || vector.length != embeddingProvider.getDimension()) {
                        throw new IllegalStateException("Dimension d'embedding inattendue");
                    }
                    batch.get(i).setEmbedding(new PGvector(vector));
                    batch.get(i).setEmbeddingModel(embeddingProvider.getModelName());
                }
            }
        } catch (Exception e) {
            chunks.forEach(chunk -> {
                chunk.setEmbedding(null);
                chunk.setEmbeddingModel(null);
            });
            log.info("Indexation sémantique des PDF joints indisponible, passages conservés pour la recherche lexicale: {}", e.getMessage());
        }
    }

    private AIConversation getOwnedConversation(Long conversationId, CustomUserDetails user) {
        if (user == null) throw new ForbiddenException("Authentification requise pour joindre un PDF");
        AIConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation IA", "id", conversationId));
        if (conversation.getUser() == null || !conversation.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Cette conversation ne vous appartient pas");
        }
        return conversation;
    }

    private Extraction extract(MultipartFile file) {
        try (PDDocument pdf = Loader.loadPDF(file.getBytes())) {
            int pageCount = pdf.getNumberOfPages();
            if (pageCount == 0 || pageCount > MAX_PAGES) {
                throw new BadRequestException("Le PDF doit contenir entre 1 et 500 pages pour être analysé.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            List<PageText> pages = new ArrayList<>();
            int characters = 0;
            int visibleCharacters = 0;
            for (int pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
                stripper.setStartPage(pageNumber);
                stripper.setEndPage(pageNumber);
                String text = stripper.getText(pdf).trim();
                if (text.isEmpty()) continue;
                characters += text.length();
                visibleCharacters += (int) text.chars().filter(ch -> !Character.isWhitespace(ch)).count();
                if (characters > MAX_EXTRACTED_CHARACTERS) {
                    throw new BadRequestException("Le texte extrait du PDF dépasse la limite de 500 000 caractères.");
                }
                pages.add(new PageText(pageNumber, text));
            }
            if (visibleCharacters == 0) {
                throw new BadRequestException("Aucun texte sélectionnable n'a été trouvé. Ce PDF semble numérisé; l'OCR n'est pas disponible.");
            }
            return new Extraction(pageCount, characters, pages);
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            log.info("PDF joint illisible ou invalide: {}", e.getMessage());
            throw new BadRequestException("Le PDF joint est corrompu, chiffré ou illisible.");
        }
    }

    private List<AIConversationAttachmentChunk> buildChunks(AIConversationAttachment attachment, List<PageText> pages) {
        List<AIConversationAttachmentChunk> chunks = new ArrayList<>();
        int chunkIndex = 0;
        for (PageText page : pages) {
            int start = 0;
            while (start < page.text().length()) {
                int end = Math.min(start + CHUNK_SIZE, page.text().length());
                String content = page.text().substring(start, end).trim();
                if (!content.isEmpty()) {
                    chunks.add(AIConversationAttachmentChunk.builder()
                            .attachment(attachment)
                            .chunkIndex(chunkIndex++)
                            .pageNumber(page.pageNumber())
                            .content(content)
                            .build());
                }
                if (end == page.text().length()) break;
                start = end - CHUNK_OVERLAP;
            }
        }
        return chunks;
    }

    private ScoredChunk score(AIConversationAttachmentChunk chunk, List<String> queryTerms) {
        Set<String> documentTerms = new HashSet<>(tokenize(chunk.getContent()));
        int matches = 0;
        for (String term : queryTerms) {
            if (documentTerms.contains(term)) matches++;
        }
        return new ScoredChunk(chunk, (double) matches / queryTerms.size());
    }

    private List<String> tokenize(String input) {
        String normalized = Normalizer.normalize(input == null ? "" : input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        var matcher = TOKEN_PATTERN.matcher(normalized);
        List<String> tokens = new ArrayList<>();
        while (matcher.find()) {
            String token = matcher.group();
            if (!STOP_WORDS.contains(token) && !token.chars().allMatch(Character::isDigit)) tokens.add(token);
        }
        return tokens;
    }

    private AIConversationAttachmentDTO toDTO(AIConversationAttachment attachment) {
        return AIConversationAttachmentDTO.builder()
                .id(attachment.getId())
                .conversationId(attachment.getConversation().getId())
                .fileName(attachment.getFileName())
                .pageCount(attachment.getPageCount())
                .extractedCharacters(attachment.getExtractedCharacters())
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    private record PageText(int pageNumber, String text) {}
    private record Extraction(int pageCount, int characterCount, List<PageText> pages) {}
    private record ScoredChunk(AIConversationAttachmentChunk chunk, double score) {}
    public record RetrievedAttachmentChunk(Long chunkId, Long attachmentId, String fileName,
                                           Integer pageNumber, String content, Double similarity) {}
}
