package com.galileo.ai;

import com.galileo.ai.dto.AIConversationAttachmentDTO;
import com.galileo.ai.entity.AIConversation;
import com.galileo.ai.entity.AIConversationAttachment;
import com.galileo.ai.entity.AIConversationAttachmentChunk;
import com.galileo.ai.entity.AIMode;
import com.galileo.ai.repository.AIConversationAttachmentChunkRepository;
import com.galileo.ai.repository.AIConversationAttachmentRepository;
import com.galileo.ai.repository.AIConversationRepository;
import com.galileo.ai.service.AIConversationAttachmentService;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.documents.service.DocumentService;
import com.galileo.embedding.provider.EmbeddingProvider;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
class AIConversationAttachmentServiceTest {

    @Mock private AIConversationRepository conversationRepository;
    @Mock private AIConversationAttachmentRepository attachmentRepository;
    @Mock private AIConversationAttachmentChunkRepository chunkRepository;
    @Mock private DocumentService documentService;
    @Mock private EmbeddingProvider embeddingProvider;
    @Mock private EntityManager entityManager;
    @Mock private Query query;

    private AIConversationAttachmentService service;
    private User owner;
    private AIConversation conversation;
    private CustomUserDetails ownerDetails;
    private final List<AIConversationAttachmentChunk> storedChunks = new ArrayList<>();
    private AIConversationAttachment storedAttachment;

    @BeforeEach
    void setUp() {
        service = new AIConversationAttachmentService(conversationRepository, attachmentRepository, chunkRepository, documentService, embeddingProvider);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
        owner = User.builder().id(41L).email("owner@example.cd").role(Role.STUDENT).build();
        ownerDetails = new CustomUserDetails(owner);
        conversation = AIConversation.builder().id(77L).user(owner).mode(AIMode.GENERAL).title("PDF test").build();
        lenient().when(conversationRepository.findById(77L)).thenReturn(Optional.of(conversation));
        lenient().when(attachmentRepository.countByConversationIdAndUserId(77L, 41L)).thenReturn(0L);
        lenient().when(attachmentRepository.save(any(AIConversationAttachment.class))).thenAnswer(invocation -> {
            storedAttachment = invocation.getArgument(0);
            storedAttachment.setId(90L);
            storedAttachment.setCreatedAt(LocalDateTime.now());
            return storedAttachment;
        });
        lenient().when(chunkRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<AIConversationAttachmentChunk> chunks = invocation.getArgument(0);
            for (int i = 0; i < chunks.size(); i++) chunks.get(i).setId(300L + i);
            storedChunks.clear();
            storedChunks.addAll(chunks);
            return chunks;
        });
    }

    @Test
    void extractsAndPersistsPageChunksForLaterConversationRetrieval() throws Exception {
        AIConversationAttachmentDTO result = service.upload(77L, pdfFile(
                "First page has ordinary text.",
                "Nova's result on the second page is 42."), ownerDetails);

        assertEquals(90L, result.getId());
        assertEquals(2, result.getPageCount());
        assertEquals(41L, storedAttachment.getUser().getId());
        assertEquals(77L, storedAttachment.getConversation().getId());
        assertEquals(AIMode.DOCUMENT, conversation.getMode());
        assertEquals(2, storedChunks.size());
        assertEquals(1, storedChunks.get(0).getPageNumber());
        assertEquals(2, storedChunks.get(1).getPageNumber());
        assertTrue(storedChunks.get(1).getContent().contains("Nova's result"));

        when(attachmentRepository.findByConversationIdAndUserIdOrderByCreatedAtAsc(77L, 41L))
                .thenReturn(List.of(storedAttachment));
        when(chunkRepository.findByAttachmentIdInOrderByAttachmentIdAscChunkIndexAsc(List.of(90L)))
                .thenReturn(storedChunks);

        List<AIConversationAttachmentService.RetrievedAttachmentChunk> retrieved =
                service.retrieveRelevantChunks(77L, 41L, "What is Nova's result?");
        assertEquals(1, retrieved.size());
        assertEquals("study.pdf", retrieved.get(0).fileName());
        assertEquals(2, retrieved.get(0).pageNumber());
        assertTrue(retrieved.get(0).content().contains("42"));
    }

    @Test
    void rejectsScannedPdfWithoutClaimingItWasAnalyzed() throws Exception {
        MockMultipartFile file = pdfFile("");

        BadRequestException error = assertThrows(BadRequestException.class, () -> service.upload(77L, file, ownerDetails));

        assertTrue(error.getMessage().contains("OCR"));
        verify(attachmentRepository, never()).save(any());
        verify(chunkRepository, never()).saveAll(anyList());
    }

    @Test
    void rejectsCorruptPdfWithExplicitClientError() {
        MockMultipartFile file = new MockMultipartFile("file", "broken.pdf", "application/pdf", "%PDF-broken".getBytes());

        BadRequestException error = assertThrows(BadRequestException.class, () -> service.upload(77L, file, ownerDetails));

        assertTrue(error.getMessage().contains("corrompu"));
        verify(attachmentRepository, never()).save(any());
    }

    @Test
    void refusesAttachmentToAnotherUsersConversationBeforeParsing() throws Exception {
        User other = User.builder().id(99L).email("other@example.cd").role(Role.STUDENT).build();
        AIConversation otherConversation = AIConversation.builder().id(77L).user(other).build();
        when(conversationRepository.findById(77L)).thenReturn(Optional.of(otherConversation));

        assertThrows(ForbiddenException.class, () -> service.upload(77L, pdfFile("not read"), ownerDetails));

        verify(documentService, never()).validatePdfFile(any());
        verify(attachmentRepository, never()).save(any());
    }

    @Test
    void usesSemanticSearchWhenVectorsAreAvailableAndKeepsPageMetadata() {
        AIConversationAttachment attachment = AIConversationAttachment.builder()
                .id(90L).conversation(conversation).user(owner).fileName("study.pdf").build();
        AIConversationAttachmentChunk chunk = AIConversationAttachmentChunk.builder()
                .id(300L).attachment(attachment).chunkIndex(0).pageNumber(2).content("semantic test chunk")
                .build();
        when(attachmentRepository.findByConversationIdAndUserIdOrderByCreatedAtAsc(77L, 41L))
                .thenReturn(List.of(attachment));
        when(chunkRepository.findByAttachmentIdInOrderByAttachmentIdAscChunkIndexAsc(List.of(90L)))
                .thenReturn(List.of(chunk));
        when(embeddingProvider.generateEmbedding("Find the reported result"))
                .thenReturn(new float[1024]);
        when(embeddingProvider.getDimension()).thenReturn(1024);
        when(embeddingProvider.getModelName()).thenReturn("test-embedding");
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.getResultList()).thenReturn(Collections.singletonList(
                new Object[]{300L, 90L, "study.pdf", 2, "Semantic result is 42", 0.88d}));

        List<AIConversationAttachmentService.RetrievedAttachmentChunk> result =
                service.retrieveRelevantChunks(77L, 41L, "Find the reported result");

        assertEquals(1, result.size());
        assertEquals(2, result.get(0).pageNumber());
        assertEquals(0.88d, result.get(0).similarity());
        assertTrue(result.get(0).content().contains("42"));
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(entityManager).createNativeQuery(sql.capture());
        assertTrue(sql.getValue().contains("a.conversation_id = :conversationId"));
        assertTrue(sql.getValue().contains("a.user_id = :userId"));
    }

    private MockMultipartFile pdfFile(String... pages) throws Exception {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            for (String text : pages) {
                PDPage page = new PDPage();
                document.addPage(page);
                if (!text.isEmpty()) {
                    try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                        stream.beginText();
                        stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                        stream.newLineAtOffset(50, 750);
                        stream.showText(text);
                        stream.endText();
                    }
                }
            }
            document.save(output);
            return new MockMultipartFile("file", "study.pdf", "application/pdf", output.toByteArray());
        }
    }
}
