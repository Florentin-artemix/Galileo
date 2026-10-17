package com.galileo.documents.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.ai.entity.AIInteraction;
import com.galileo.ai.repository.AIInteractionRepository;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentChunk;
import com.galileo.documents.entity.DocumentEmbedding;
import com.galileo.documents.entity.DocumentProcessingStatus;
import com.galileo.documents.repository.DocumentChunkRepository;
import com.galileo.documents.repository.DocumentEmbeddingRepository;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.storage.service.StorageService;
import com.galileo.submissions.entity.Submission;
import com.galileo.submissions.entity.SubmissionStatus;
import com.galileo.submissions.repository.SubmissionRepository;
import com.pgvector.PGvector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentProcessingService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final DocumentEmbeddingRepository embeddingRepository;
    private final SubmissionRepository submissionRepository;
    private final StorageService storageService;
    private final EmbeddingProvider embeddingProvider;
    private final AIInteractionRepository interactionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Traitement asynchrone complet d'un document PDF :
     * 1. Extraction du texte page par page via Apache PDFBox 3
     * 2. Nettoyage et découpage en passages cohérents (DocumentChunk)
     * 3. Génération des embeddings sémantiques Qwen text-embedding-v4 (dimension 1024)
     * 4. Stockage pgvector et suivi de statut (UPLOADED -> PROCESSING -> COMPLETED / FAILED)
     */
    @Async
    public CompletableFuture<Void> processDocumentAsync(Long documentId, Long submissionId) {
        log.info("Démarrage du traitement asynchrone du document #{} (soumission #{})", documentId, submissionId);
        long startTime = System.currentTimeMillis();

        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.error("Document #{} introuvable pour le traitement asynchrone", documentId);
            return CompletableFuture.completedFuture(null);
        }

        Submission submission = null;
        if (submissionId != null) {
            submission = submissionRepository.findById(submissionId).orElse(null);
            if (submission != null) {
                submission.setStatus(SubmissionStatus.ANALYZING);
                submissionRepository.save(submission);
            }
        }

        document.setProcessingStatus(DocumentProcessingStatus.PROCESSING);
        document.setProcessingError(null);
        documentRepository.save(document);

        try {
            // 1. Téléchargement des octets depuis le stockage R2 / local
            byte[] pdfBytes;
            try (InputStream is = storageService.downloadFile(document.getFileKey());
                 ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int n;
                while ((n = is.read(buffer)) != -1) {
                    baos.write(buffer, 0, n);
                }
                pdfBytes = baos.toByteArray();
            }

            // 2. Extraction du texte via Apache PDFBox
            List<PageText> pages = new ArrayList<>();
            StringBuilder fullTextBuilder = new StringBuilder();

            try (PDDocument pdDoc = Loader.loadPDF(pdfBytes)) {
                int totalPages = pdDoc.getNumberOfPages();
                document.setPageCount(totalPages);

                PDFTextStripper stripper = new PDFTextStripper();
                for (int pageNum = 1; pageNum <= totalPages; pageNum++) {
                    stripper.setStartPage(pageNum);
                    stripper.setEndPage(pageNum);
                    String pageContent = stripper.getText(pdDoc).trim();
                    if (!pageContent.isEmpty()) {
                        pages.add(new PageText(pageNum, pageContent));
                        fullTextBuilder.append(pageContent).append("\n\n");
                    }
                }
            }

            String fullExtractedText = fullTextBuilder.toString().trim();
            if (fullExtractedText.length() > 500000) {
                document.setExtractedText(fullExtractedText.substring(0, 500000));
            } else {
                document.setExtractedText(fullExtractedText);
            }

            // 3. Découpage en passages cohérents (Chunking intelligent)
            List<ChunkData> chunks = buildChunksFromPages(pages);

            // 4. Nettoyage préalable pour garantir l'idempotence (suppression des anciens chunks et embeddings)
            cleanExistingChunksAndEmbeddings(document.getId());

            // 5. Sauvegarde des chunks et vectorisation Qwen (1024 dims)
            int chunkIndex = 0;
            int totalTokensEstimated = 0;

            for (ChunkData c : chunks) {
                int tokenEstimate = Math.max(1, c.text.length() / 4);
                totalTokensEstimated += tokenEstimate;

                DocumentChunk chunk = DocumentChunk.builder()
                        .document(document)
                        .chunkIndex(chunkIndex++)
                        .content(c.text)
                        .pageStart(c.startPage)
                        .pageEnd(c.endPage)
                        .tokenCount(tokenEstimate)
                        .build();
                chunk = chunkRepository.save(chunk);

                // Génération vecteur Qwen
                float[] vector = embeddingProvider.generateEmbedding(c.text);
                if (vector != null && vector.length == embeddingProvider.getDimension()) {
                    DocumentEmbedding embedding = DocumentEmbedding.builder()
                            .chunk(chunk)
                            .embedding(new PGvector(vector))
                            .model(embeddingProvider.getModelName())
                            .provider(embeddingProvider.getProviderName())
                            .dimension(embeddingProvider.getDimension())
                            .build();
                    embeddingRepository.save(embedding);
                }
            }

            // Enregistrement métrique observabilité IA (Qwen Embeddings)
            long duration = System.currentTimeMillis() - startTime;
            recordEmbeddingInteraction(submission != null ? submission.getSubmittedBy() : null,
                    chunks.size(), totalTokensEstimated, (int) duration);

            // 6. Finalisation du Document
            document.setProcessingStatus(DocumentProcessingStatus.COMPLETED);
            document.setProcessedAt(LocalDateTime.now());
            document.setProcessingError(null);
            documentRepository.save(document);

            // 7. Mise à jour de la soumission le cas échéant -> UNDER_REVIEW
            if (submission != null) {
                Map<String, Object> analysis = new HashMap<>();
                analysis.put("pages", document.getPageCount());
                analysis.put("chunksExtracted", chunks.size());
                analysis.put("tokensEstimated", totalTokensEstimated);
                analysis.put("processedAt", LocalDateTime.now().toString());
                analysis.put("quality", fullExtractedText.length() > 200 ? "VALID" : "LOW_TEXT");

                submission.setAiAnalysis(objectMapper.writeValueAsString(analysis));
                submission.setStatus(SubmissionStatus.UNDER_REVIEW);
                submissionRepository.save(submission);
            }

            log.info("Traitement asynchrone terminé avec succès pour document #{}: {} pages, {} chunks en {}ms",
                    documentId, document.getPageCount(), chunks.size(), duration);

        } catch (Exception e) {
            log.error("Échec du traitement asynchrone du document #{} : {}", documentId, e.getMessage(), e);
            document.setProcessingStatus(DocumentProcessingStatus.FAILED);
            document.setProcessingError("Échec de l'indexation : " + e.getMessage());
            documentRepository.save(document);

            if (submission != null) {
                submission.setStatus(SubmissionStatus.UNDER_REVIEW);
                submissionRepository.save(submission);
            }
        }

        return CompletableFuture.completedFuture(null);
    }

    @Transactional
    public void cleanExistingChunksAndEmbeddings(Long documentId) {
        try {
            embeddingRepository.deleteByDocumentId(documentId);
            chunkRepository.deleteByDocumentId(documentId);
        } catch (Exception e) {
            log.warn("Nettoyage des anciens chunks pour document #{}: {}", documentId, e.getMessage());
        }
    }

    private List<ChunkData> buildChunksFromPages(List<PageText> pages) {
        List<ChunkData> result = new ArrayList<>();
        if (pages.isEmpty()) {
            return result;
        }

        final int TARGET_CHUNK_SIZE = 1200; // ~300 mots
        final int OVERLAP = 150;

        StringBuilder currentChunk = new StringBuilder();
        int chunkStartPage = pages.get(0).page;
        int chunkEndPage = chunkStartPage;

        for (PageText pt : pages) {
            String[] paragraphs = pt.text.split("\n\n+");
            for (String para : paragraphs) {
                String cleanPara = para.trim().replaceAll("\\s+", " ");
                if (cleanPara.isEmpty()) continue;

                if (currentChunk.length() + cleanPara.length() > TARGET_CHUNK_SIZE && currentChunk.length() > 0) {
                    result.add(new ChunkData(currentChunk.toString().trim(), chunkStartPage, chunkEndPage));

                    // Conserver l'overlap
                    String previous = currentChunk.toString();
                    currentChunk = new StringBuilder();
                    if (previous.length() > OVERLAP) {
                        currentChunk.append(previous.substring(previous.length() - OVERLAP)).append(" ");
                    }
                    chunkStartPage = pt.page;
                }

                currentChunk.append(cleanPara).append("\n");
                chunkEndPage = pt.page;
            }
        }

        if (currentChunk.length() > 0) {
            result.add(new ChunkData(currentChunk.toString().trim(), chunkStartPage, chunkEndPage));
        }

        return result;
    }

    private void recordEmbeddingInteraction(com.galileo.auth.entity.User user, int chunks, int tokens, int durationMs) {
        try {
            AIInteraction interaction = AIInteraction.builder()
                    .user(user)
                    .interactionType("EMBEDDING")
                    .functionName("document_indexing")
                    .provider(embeddingProvider.getProviderName())
                    .model(embeddingProvider.getModelName())
                    .inputTokens(tokens)
                    .outputTokens(0)
                    .dimension(embeddingProvider.getDimension())
                    .numberOfChunks(chunks)
                    .estimatedCost(BigDecimal.valueOf(tokens * 0.0000001))
                    .durationMs(durationMs)
                    .build();
            interactionRepository.save(interaction);
        } catch (Exception e) {
            log.warn("Impossible d'enregistrer la métrique d'interaction IA : {}", e.getMessage());
        }
    }

    private record PageText(int page, String text) {}
    private record ChunkData(String text, int startPage, int endPage) {}
}
