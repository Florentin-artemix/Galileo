package com.galileo.publications;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentProcessingStatus;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationAuthor;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.*;
import com.galileo.publications.service.PublicationService;
import com.galileo.auth.repository.UserRepository;
import com.galileo.storage.service.StorageService;
import com.galileo.users.repository.InstitutionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicationPdfAccessTest {

    @Mock private PublicationRepository publicationRepository;
    @Mock private PublicationAuthorRepository authorRepository;
    @Mock private PublicationKeywordRepository keywordRepository;
    @Mock private KeywordRepository mainKeywordRepository;
    @Mock private DomainRepository domainRepository;
    @Mock private InstitutionRepository institutionRepository;
    @Mock private UserRepository userRepository;
    @Mock private DocumentRepository documentRepository;
    @Mock private StorageService storageService;

    @InjectMocks private PublicationService publicationService;

    @Test
    void anonymousVisitorDoesNotReceiveUrlForPublicPublicationPdf() {
        Publication publication = publication(AccessLevel.PUBLIC);
        Document document = document(publication);
        when(authorRepository.findByPublicationIdOrderByPositionAsc(15L)).thenReturn(List.of());
        when(keywordRepository.findByPublicationId(15L)).thenReturn(List.of());
        when(documentRepository.findByPublicationId(15L)).thenReturn(List.of(document));

        Map<String, Object> response = publicationService.toMapResponse(publication, null);

        assertNull(response.get("urlPdf"));
        verify(storageService, never()).generatePresignedUrl(anyString(), anyInt());
    }

    @Test
    void viewerCanReadPublicMetadataButCannotReadFullPdf() {
        Publication publication = publication(AccessLevel.PUBLIC);
        Document document = document(publication);
        CustomUserDetails viewer = new CustomUserDetails(User.builder()
                .id(23L)
                .email("viewer@example.test")
                .role(Role.VIEWER)
                .isActive(true)
                .build());
        when(authorRepository.findByPublicationIdOrderByPositionAsc(15L)).thenReturn(List.of());
        when(keywordRepository.findByPublicationId(15L)).thenReturn(List.of());
        when(documentRepository.findByPublicationId(15L)).thenReturn(List.of(document));

        Map<String, Object> response = publicationService.toMapResponse(publication, viewer);

        assertTrue(publicationService.isAuthorizedToAccess(publication, viewer));
        assertFalse(publicationService.isAuthorizedToReadFullDocument(publication, viewer));
        assertNull(response.get("urlPdf"));
        verify(storageService, never()).generatePresignedUrl(anyString(), anyInt());
    }

    @Test
    void visitorCannotRequestDownloadUrlForPublicPdf() {
        Publication publication = publication(AccessLevel.PUBLIC);
        when(publicationRepository.findById(15L)).thenReturn(java.util.Optional.of(publication));

        org.junit.jupiter.api.Assertions.assertThrows(
                com.galileo.common.exception.ForbiddenException.class,
                () -> publicationService.getDownloadUrl(15L, null));
        verify(documentRepository, never()).findByPublicationId(15L);
        verify(storageService, never()).generatePresignedUrl(anyString(), anyInt());
    }

    @Test
    void authenticatedStudentRetainsInstitutionalPdfAccess() {
        Publication publication = publication(AccessLevel.INSTITUTIONAL);
        Document document = document(publication);
        CustomUserDetails student = new CustomUserDetails(User.builder()
                .id(22L)
                .email("student@example.test")
                .role(Role.STUDENT)
                .isActive(true)
                .build());
        when(authorRepository.findByPublicationIdOrderByPositionAsc(15L)).thenReturn(List.of());
        when(keywordRepository.findByPublicationId(15L)).thenReturn(List.of());
        when(documentRepository.findByPublicationId(15L)).thenReturn(List.of(document));
        Map<String, Object> response = publicationService.toMapResponse(publication, student);

        assertEquals("/api/documents/43/download", response.get("urlPdf"));
        verify(storageService, never()).generatePresignedUrl(anyString(), anyInt());
    }

    @Test
    void researcherAndTeacherRetainPublicAndInstitutionalAccess() {
        Publication pubPublic = publication(AccessLevel.PUBLIC);
        Publication pubInst = publication(AccessLevel.INSTITUTIONAL);

        CustomUserDetails researcher = new CustomUserDetails(User.builder()
                .id(25L).email("researcher@example.test").role(Role.RESEARCHER).isActive(true).build());
        CustomUserDetails teacher = new CustomUserDetails(User.builder()
                .id(26L).email("teacher@example.test").role(Role.TEACHER).isActive(true).build());

        when(authorRepository.findByPublicationIdOrderByPositionAsc(15L)).thenReturn(List.of());

        assertTrue(publicationService.isAuthorizedToAccess(pubPublic, researcher));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(pubPublic, researcher));
        assertTrue(publicationService.isAuthorizedToAccess(pubInst, researcher));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(pubInst, researcher));

        assertTrue(publicationService.isAuthorizedToAccess(pubPublic, teacher));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(pubPublic, teacher));
        assertTrue(publicationService.isAuthorizedToAccess(pubInst, teacher));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(pubInst, teacher));
    }

    @Test
    void authorCanAccessUnpublishedAndRestrictedPublicationAndDocument() {
        User authorUser = User.builder().id(30L).email("author@example.test").role(Role.STUDENT).isActive(true).build();
        CustomUserDetails authorDetails = new CustomUserDetails(authorUser);

        PublicationAuthor authorRecord = PublicationAuthor.builder().publication(null).user(authorUser).build();
        when(authorRepository.findByPublicationIdOrderByPositionAsc(15L)).thenReturn(List.of(authorRecord));

        Publication draftPub = Publication.builder()
                .id(15L).status(PublicationStatus.DRAFT).accessLevel(AccessLevel.PUBLIC).build();
        Publication restrictedPub = Publication.builder()
                .id(15L).status(PublicationStatus.PUBLISHED).accessLevel(AccessLevel.RESTRICTED).build();

        assertTrue(publicationService.isAuthorizedToAccess(draftPub, authorDetails));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(draftPub, authorDetails));
        assertTrue(publicationService.isAuthorizedToAccess(restrictedPub, authorDetails));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(restrictedPub, authorDetails));
    }

    @Test
    void nonAuthorCannotAccessUnpublishedOrRestrictedPdf() {
        User otherUser = User.builder().id(31L).email("other@example.test").role(Role.STUDENT).isActive(true).build();
        CustomUserDetails otherDetails = new CustomUserDetails(otherUser);

        when(authorRepository.findByPublicationIdOrderByPositionAsc(15L)).thenReturn(List.of());

        Publication draftPub = Publication.builder()
                .id(15L).status(PublicationStatus.DRAFT).accessLevel(AccessLevel.PUBLIC).build();
        Publication restrictedPub = Publication.builder()
                .id(15L).status(PublicationStatus.PUBLISHED).accessLevel(AccessLevel.RESTRICTED).build();

        assertFalse(publicationService.isAuthorizedToAccess(draftPub, otherDetails));
        assertFalse(publicationService.isAuthorizedToReadFullDocument(draftPub, otherDetails));
        assertFalse(publicationService.isAuthorizedToAccess(restrictedPub, otherDetails));
        assertFalse(publicationService.isAuthorizedToReadFullDocument(restrictedPub, otherDetails));
    }

    @Test
    void staffAndAdminHaveFullAccessToAnyPublicationAndPdf() {
        CustomUserDetails staff = new CustomUserDetails(User.builder().id(1L).email("staff@example.test").role(Role.STAFF).isActive(true).build());
        CustomUserDetails admin = new CustomUserDetails(User.builder().id(2L).email("admin@example.test").role(Role.ADMIN).isActive(true).build());

        Publication draftRestricted = Publication.builder()
                .id(15L).status(PublicationStatus.DRAFT).accessLevel(AccessLevel.RESTRICTED).build();

        assertTrue(publicationService.isAuthorizedToAccess(draftRestricted, staff));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(draftRestricted, staff));
        assertTrue(publicationService.isAuthorizedToAccess(draftRestricted, admin));
        assertTrue(publicationService.isAuthorizedToReadFullDocument(draftRestricted, admin));
    }

    @Test
    void anonymousAndViewerCannotAccessRestrictedOrUnpublishedMetadata() {
        Publication draftPub = Publication.builder()
                .id(15L).status(PublicationStatus.DRAFT).accessLevel(AccessLevel.PUBLIC).build();
        Publication restrictedPub = Publication.builder()
                .id(15L).status(PublicationStatus.PUBLISHED).accessLevel(AccessLevel.RESTRICTED).build();
        Publication institutionalPub = publication(AccessLevel.INSTITUTIONAL);

        CustomUserDetails viewer = new CustomUserDetails(User.builder().id(9L).email("viewer@example.test").role(Role.VIEWER).isActive(true).build());

        assertFalse(publicationService.isAuthorizedToAccess(draftPub, null));
        assertFalse(publicationService.isAuthorizedToAccess(restrictedPub, null));
        assertFalse(publicationService.isAuthorizedToAccess(institutionalPub, null));

        assertFalse(publicationService.isAuthorizedToAccess(draftPub, viewer));
        assertFalse(publicationService.isAuthorizedToAccess(restrictedPub, viewer));
        assertFalse(publicationService.isAuthorizedToAccess(institutionalPub, viewer));
    }

    private Publication publication(AccessLevel accessLevel) {
        return Publication.builder()
                .id(15L)
                .title("PDF access policy")
                .slug("pdf-access-policy")
                .status(PublicationStatus.PUBLISHED)
                .accessLevel(accessLevel)
                .build();
    }

    private Document document(Publication publication) {
        return Document.builder()
                .id(43L)
                .publication(publication)
                .fileName("report.pdf")
                .fileKey("publications/15/report.pdf")
                .processingStatus(DocumentProcessingStatus.COMPLETED)
                .build();
    }
}
