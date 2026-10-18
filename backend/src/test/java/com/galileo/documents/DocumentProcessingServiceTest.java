package com.galileo.documents;

import com.galileo.ai.repository.AIInteractionRepository;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentProcessingStatus;
import com.galileo.documents.repository.DocumentChunkRepository;
import com.galileo.documents.repository.DocumentEmbeddingRepository;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.documents.service.DocumentProcessingService;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.storage.service.StorageService;
import com.galileo.submissions.entity.Submission;
import com.galileo.submissions.entity.SubmissionStatus;
import com.galileo.submissions.repository.SubmissionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentProcessingServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository chunkRepository;

    @Mock
    private DocumentEmbeddingRepository embeddingRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private EmbeddingProvider embeddingProvider;

    @Mock
    private AIInteractionRepository interactionRepository;

    @InjectMocks
    private DocumentProcessingService processingService;

    @Test
    @DisplayName("When storage download throws exception, document status becomes FAILED and submission remains PENDING")
    void testDownloadFailureMarksDocumentFailedAndKeepsSubmissionPending() {
        Document doc = Document.builder()
                .id(100L)
                .fileKey("publications/1/invalid.pdf")
                .processingStatus(DocumentProcessingStatus.UPLOADED)
                .build();

        Submission submission = Submission.builder()
                .id(200L)
                .status(SubmissionStatus.PENDING)
                .build();

        when(documentRepository.findById(100L)).thenReturn(Optional.of(doc));
        when(submissionRepository.findById(200L)).thenReturn(Optional.of(submission));
        when(storageService.downloadFile(anyString())).thenThrow(new RuntimeException("S3 Connection Timeout"));

        CompletableFuture<Void> future = processingService.processDocumentAsync(100L, 200L);
        future.join();

        assertEquals(DocumentProcessingStatus.FAILED, doc.getProcessingStatus());
        assertTrue(doc.getProcessingError().contains("S3 Connection Timeout"));
        assertEquals(SubmissionStatus.PENDING, submission.getStatus());
        assertNotNull(submission.getAiAnalysis());
        assertTrue(submission.getAiAnalysis().contains("FAILED"));

        verify(documentRepository, atLeastOnce()).save(doc);
        verify(submissionRepository, atLeastOnce()).save(submission);
    }

    @Test
    @DisplayName("cleanExistingChunksAndEmbeddings deletes past records cleanly")
    void testCleanExistingChunksAndEmbeddings() {
        processingService.cleanExistingChunksAndEmbeddings(100L);

        verify(embeddingRepository, times(1)).deleteByDocumentId(100L);
        verify(chunkRepository, times(1)).deleteByDocumentId(100L);
    }
}
