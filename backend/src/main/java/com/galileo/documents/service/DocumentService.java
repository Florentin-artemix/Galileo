package com.galileo.documents.service;

import com.galileo.auth.entity.Role;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.dto.DocumentDTO;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentProcessingStatus;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.PublicationAuthorRepository;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.storage.service.StorageService;
import com.galileo.submissions.entity.Submission;
import com.galileo.submissions.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final SubmissionRepository submissionRepository;
    private final StorageService storageService;
    private final DocumentProcessingService documentProcessingService;

    public void validatePdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Le fichier PDF est requis");
        }

        // 1. Taille maximale 50MB
        if (file.getSize() > 50 * 1024 * 1024) {
            throw new BadRequestException("Le fichier dépasse la taille maximale autorisée de 50 Mo");
        }

        // 2. Extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Seuls les fichiers avec l'extension .pdf sont acceptés");
        }

        // 3. Signature binaire réelle (Magic Bytes: %PDF-)
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[5];
            int bytesRead = is.read(header);
            if (bytesRead < 4 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F') {
                throw new BadRequestException("Signature de fichier invalide : le document n'est pas un fichier PDF authentique");
            }
        } catch (IOException e) {
            throw new BadRequestException("Impossible d'inspecter l'en-tête du fichier : " + e.getMessage());
        }
    }

    @Transactional
    public DocumentDTO uploadDocument(Long publicationId, MultipartFile file, CustomUserDetails user) {
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));

        if (!canModifyPublication(publication, user)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation d'ajouter un document à cette publication");
        }

        validatePdfFile(file);

        // Nettoyage sécurisé du nom de fichier
        String rawFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        String cleanFilename = rawFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

        String fileKey = "publications/" + publicationId + "/" + UUID.randomUUID() + ".pdf";

        try (InputStream is = file.getInputStream()) {
            storageService.uploadFile(fileKey, is, file.getSize(), "application/pdf");
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier dans le stockage", e);
        }

        List<Document> existingDocs = documentRepository.findByPublicationId(publicationId);
        int nextVersion = existingDocs.stream()
                .mapToInt(d -> d.getVersion() != null ? d.getVersion() : 1)
                .max()
                .orElse(0) + 1;

        Document document = Document.builder()
                .publication(publication)
                .fileName(cleanFilename)
                .fileKey(fileKey)
                .fileSize(file.getSize())
                .mimeType("application/pdf")
                .processingStatus(DocumentProcessingStatus.UPLOADED)
                .version(nextVersion)
                .build();
        document = documentRepository.save(document);

        // Déclenchement de l'indexation et extraction asynchrone
        documentProcessingService.processDocumentAsync(document.getId(), null);

        log.info("Document #{} téléversé pour publication #{}, version {}", document.getId(), publicationId, nextVersion);
        return toDTO(document);
    }

    @Transactional(readOnly = true)
    public DocumentDTO getDocumentById(Long documentId, CustomUserDetails user) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        if (!isAuthorizedToAccess(document.getPublication(), user)) {
            throw new ForbiddenException("Accès non autorisé à ce document");
        }

        return toDTO(document);
    }

    @Transactional(readOnly = true)
    public DocumentDTO getDocumentByPublicationId(Long publicationId, CustomUserDetails user) {
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));

        if (!isAuthorizedToAccess(publication, user)) {
            throw new ForbiddenException("Accès non autorisé à cette publication");
        }

        List<Document> docs = documentRepository.findByPublicationId(publicationId);
        if (docs.isEmpty()) {
            throw new ResourceNotFoundException("Document", "publicationId", publicationId);
        }

        return toDTO(docs.get(0));
    }

    @Transactional(readOnly = true)
    public InputStream getDocumentStream(Long documentId, CustomUserDetails user) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        if (!isAuthorizedToAccess(document.getPublication(), user)) {
            throw new ForbiddenException("Téléchargement non autorisé pour ce document");
        }

        return storageService.downloadFile(document.getFileKey());
    }

    @Transactional(readOnly = true)
    public InputStream getDocumentStreamByKey(String fileKey, CustomUserDetails user) {
        Document document = documentRepository.findByFileKey(fileKey).orElse(null);
        if (document != null && !isAuthorizedToAccess(document.getPublication(), user)) {
            throw new ForbiddenException("Téléchargement non autorisé pour cette clé");
        }

        return storageService.downloadFile(fileKey);
    }

    @Transactional(readOnly = true)
    public String getPresignedDownloadUrl(Long documentId, CustomUserDetails user) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        if (!isAuthorizedToAccess(document.getPublication(), user)) {
            throw new ForbiddenException("Téléchargement non autorisé pour ce document");
        }

        return storageService.generatePresignedUrl(document.getFileKey(), 60);
    }

    @Transactional
    public DocumentDTO retryDocumentProcessing(Long documentId, CustomUserDetails user) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        if (!canModifyPublication(document.getPublication(), user)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation de relancer le traitement de ce document");
        }

        Long submissionId = null;
        List<Submission> submissions = submissionRepository.findByPublicationId(document.getPublication().getId());
        if (!submissions.isEmpty()) {
            submissionId = submissions.get(0).getId();
        }

        document.setProcessingStatus(DocumentProcessingStatus.UPLOADED);
        document.setProcessingError(null);
        document = documentRepository.save(document);

        documentProcessingService.processDocumentAsync(document.getId(), submissionId);
        log.info("Relance du traitement pour document #{} demandée par utilisateur #{}", documentId, user.getId());

        return toDTO(document);
    }

    @Transactional
    public DocumentDTO retryByPublicationId(Long publicationId, CustomUserDetails user) {
        List<Document> docs = documentRepository.findByPublicationId(publicationId);
        if (docs.isEmpty()) {
            throw new ResourceNotFoundException("Document", "publicationId", publicationId);
        }
        return retryDocumentProcessing(docs.get(0).getId(), user);
    }

    public boolean isAuthorizedToAccess(Publication pub, CustomUserDetails user) {
        if (pub == null) return false;

        // STAFF et ADMIN ont accès à toutes les publications
        if (user != null && (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN)) {
            return true;
        }

        // L'auteur a toujours accès à sa propre publication
        if (user != null) {
            boolean isAuthor = authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId()).stream()
                    .anyMatch(a -> a.getUser() != null && a.getUser().getId().equals(user.getId()));
            if (isAuthor) return true;
        }

        // Si la publication n'est pas encore publiée, seul l'auteur ou le STAFF peut la voir
        if (pub.getStatus() != PublicationStatus.PUBLISHED) {
            return false;
        }

        // Niveau d'accès
        if (pub.getAccessLevel() == AccessLevel.PUBLIC) {
            return true;
        }
        if (pub.getAccessLevel() == AccessLevel.INSTITUTIONAL) {
            return user != null; // Compte authentifié requis
        }

        // RESTRICTED ou PRIVATE : réservé aux auteurs ou staff (déjà vérifié ci-dessus)
        return false;
    }

    private boolean canModifyPublication(Publication pub, CustomUserDetails user) {
        if (user == null) return false;
        if (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN) return true;
        return authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId()).stream()
                .anyMatch(a -> a.getUser() != null && a.getUser().getId().equals(user.getId()));
    }

    public DocumentDTO toDTO(Document d) {
        return DocumentDTO.builder()
                .id(d.getId())
                .publicationId(d.getPublication() != null ? d.getPublication().getId() : null)
                .fileName(d.getFileName())
                .fileKey(d.getFileKey())
                .fileSize(d.getFileSize())
                .mimeType(d.getMimeType())
                .pageCount(d.getPageCount())
                .processingStatus(d.getProcessingStatus())
                .processingError(d.getProcessingError())
                .version(d.getVersion())
                .processedAt(d.getProcessedAt())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
