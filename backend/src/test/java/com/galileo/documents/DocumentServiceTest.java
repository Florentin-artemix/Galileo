package com.galileo.documents;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.dto.DocumentDTO;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentProcessingStatus;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.documents.service.DocumentProcessingService;
import com.galileo.documents.service.DocumentService;
import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.repository.PublicationAuthorRepository;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.storage.service.StorageService;
import com.galileo.submissions.repository.SubmissionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private PublicationRepository publicationRepository;

    @Mock
    private PublicationAuthorRepository authorRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private DocumentProcessingService documentProcessingService;

    @InjectMocks
    private DocumentService documentService;

    @Test
    @DisplayName("Uploading non-PDF file (corrupted magic bytes) must be rejected with BadRequestException")
    void testUploadNonPdfRejected() {
        byte[] fakeContent = "This is not a PDF file at all!".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                fakeContent
        );

        assertThrows(BadRequestException.class, () ->
                documentService.validatePdfFile(file)
        );
        verify(storageService, never()).uploadFile(any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("Uploading valid PDF with %PDF- header should succeed, save document, and trigger async processing")
    void testUploadValidPdfSucceeds() {
        byte[] validPdf = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "article.pdf",
                "application/pdf",
                validPdf
        );

        User uploader = User.builder().id(1L).email("staff@mapon.cd").role(Role.STAFF).build();
        CustomUserDetails userDetails = new CustomUserDetails(uploader);
        Publication publication = Publication.builder().id(10L).title("Recherche Métallurgie").build();

        when(publicationRepository.findById(10L)).thenReturn(Optional.of(publication));
        when(storageService.uploadFile(anyString(), any(InputStream.class), anyLong(), anyString()))
                .thenReturn("publications/10/storage-key-123.pdf");
        when(documentRepository.findByPublicationId(10L)).thenReturn(Collections.emptyList());
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(99L);
            return doc;
        });

        DocumentDTO result = documentService.uploadDocument(10L, file, userDetails);

        assertNotNull(result);
        assertEquals(99L, result.getId());
        assertEquals("article.pdf", result.getFileName());
        assertEquals(DocumentProcessingStatus.UPLOADED, result.getProcessingStatus());
        verify(documentProcessingService, times(1)).processDocumentAsync(eq(99L), any());
    }

    @Test
    @DisplayName("Retrying document processing resets status to UPLOADED and relaunches pipeline")
    void testRetryDocumentProcessing() {
        User staff = User.builder().id(2L).email("staff@mapon.cd").role(Role.STAFF).build();
        CustomUserDetails userDetails = new CustomUserDetails(staff);

        Publication publication = Publication.builder().id(10L).accessLevel(AccessLevel.PUBLIC).build();
        Document failedDoc = Document.builder()
                .id(42L)
                .publication(publication)
                .processingStatus(DocumentProcessingStatus.FAILED)
                .processingError("Timeout during embedding")
                .build();

        when(documentRepository.findById(42L)).thenReturn(Optional.of(failedDoc));
        when(documentRepository.save(any(Document.class))).thenAnswer(i -> i.getArgument(0));
        when(submissionRepository.findByPublicationId(10L)).thenReturn(Collections.emptyList());

        DocumentDTO retried = documentService.retryDocumentProcessing(42L, userDetails);

        assertEquals(DocumentProcessingStatus.UPLOADED, retried.getProcessingStatus());
        assertNull(retried.getProcessingError());
        verify(documentProcessingService, times(1)).processDocumentAsync(eq(42L), any());
    }

    @Test
    @DisplayName("Document lookup by publication returns the newest version")
    void testGetDocumentByPublicationReturnsNewestVersion() {
        User staff = User.builder().id(3L).email("staff@mapon.cd").role(Role.STAFF).build();
        CustomUserDetails userDetails = new CustomUserDetails(staff);
        Publication publication = Publication.builder().id(10L).build();
        when(publicationRepository.findById(10L)).thenReturn(Optional.of(publication));
        Document older = Document.builder().id(20L).publication(publication).version(1).build();
        Document newest = Document.builder().id(21L).publication(publication).version(2).build();
        when(documentRepository.findByPublicationId(10L)).thenReturn(List.of(newest, older));

        DocumentDTO result = documentService.getDocumentByPublicationId(10L, userDetails);

        assertEquals(21L, result.getId());
        assertEquals(2, result.getVersion());
    }

    @Test
    @DisplayName("An anonymous visitor cannot stream even a public publication PDF by key")
    void anonymousVisitorCannotStreamPublicDocumentByKey() {
        Publication publication = Publication.builder()
                .id(10L)
                .status(com.galileo.publications.entity.PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .build();
        Document document = Document.builder()
                .id(42L)
                .publication(publication)
                .fileKey("publications/10/secret.pdf")
                .build();
        when(documentRepository.findByFileKey("publications/10/secret.pdf"))
                .thenReturn(Optional.of(document));

        assertThrows(ForbiddenException.class, () ->
                documentService.getDocumentStreamByKey("publications/10/secret.pdf", null));
        verify(storageService, never()).downloadFile(anyString());
    }

    @Test
    @DisplayName("An authenticated VIEWER still cannot stream a public publication PDF")
    void viewerCannotStreamPublicDocumentByKey() {
        User viewerUser = User.builder().id(9L).email("viewer@example.test").role(Role.VIEWER).build();
        CustomUserDetails viewer = new CustomUserDetails(viewerUser);
        Publication publication = Publication.builder()
                .id(10L)
                .status(com.galileo.publications.entity.PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .build();
        Document document = Document.builder()
                .id(42L)
                .publication(publication)
                .fileKey("publications/10/secret.pdf")
                .build();
        when(documentRepository.findByFileKey("publications/10/secret.pdf"))
                .thenReturn(Optional.of(document));

        assertThrows(ForbiddenException.class, () ->
                documentService.getDocumentStreamByKey("publications/10/secret.pdf", viewer));
        verify(storageService, never()).downloadFile(anyString());
    }

    @Test
    @DisplayName("Authorized document URL uses the protected API proxy, never a storage URL")
    void authorizedDocumentUrlUsesProtectedProxy() {
        User studentUser = User.builder().id(7L).email("student@example.test").role(Role.STUDENT).build();
        CustomUserDetails student = new CustomUserDetails(studentUser);
        Publication publication = Publication.builder()
                .id(10L)
                .status(com.galileo.publications.entity.PublicationStatus.PUBLISHED)
                .accessLevel(AccessLevel.PUBLIC)
                .build();
        Document document = Document.builder()
                .id(42L)
                .publication(publication)
                .fileKey("publications/10/paper.pdf")
                .build();
        when(documentRepository.findById(42L)).thenReturn(Optional.of(document));
        when(authorRepository.findByPublicationIdOrderByPositionAsc(10L)).thenReturn(List.of());

        assertEquals("/api/documents/42/download", documentService.getPresignedDownloadUrl(42L, student));
        verify(storageService, never()).generatePresignedUrl(anyString(), anyInt());
    }

    @Test
    @DisplayName("Unregistered storage keys cannot be used to stream arbitrary objects")
    void unregisteredStorageKeyIsRejected() {
        when(documentRepository.findByFileKey("publications/10/orphan.pdf"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                documentService.getDocumentStreamByKey("publications/10/orphan.pdf", null));
        verify(storageService, never()).downloadFile(anyString());
    }

    @Test
    @DisplayName("Known public image namespaces remain streamable without a document row")
    void publicImageKeyRemainsStreamable() {
        InputStream image = InputStream.nullInputStream();
        when(documentRepository.findByFileKey("blog/cover.webp")).thenReturn(Optional.empty());
        when(storageService.downloadFile("blog/cover.webp")).thenReturn(image);

        assertSame(image, documentService.getDocumentStreamByKey("blog/cover.webp", null));
        verify(storageService).downloadFile("blog/cover.webp");
    }
}
