package com.galileo.submissions.service;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentProcessingStatus;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.documents.service.DocumentProcessingService;
import com.galileo.notifications.entity.Notification;
import com.galileo.notifications.entity.NotificationType;
import com.galileo.notifications.repository.NotificationRepository;
import com.galileo.publications.entity.*;
import com.galileo.publications.repository.*;
import com.galileo.storage.service.StorageService;
import com.galileo.submissions.entity.Submission;
import com.galileo.submissions.entity.SubmissionStatus;
import com.galileo.submissions.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final PublicationKeywordRepository publicationKeywordRepository;
    private final KeywordRepository keywordRepository;
    private final DomainRepository domainRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final StorageService storageService;
    private final DocumentProcessingService documentProcessingService;

    @Transactional
    public Map<String, Object> createSubmission(
            Long userId,
            MultipartFile file,
            String titre,
            String resume,
            String auteurPrincipal,
            String emailAuteur,
            List<String> coAuteurs,
            List<String> motsCles,
            String domaineRecherche,
            String notes
    ) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Le fichier PDF de la publication est obligatoire");
        }

        // 1. Validation stricte du type PDF et de la signature binaire
        validatePdfFile(file);
        SubmissionMetadataValidator.validate(titre, resume);

        User submitter = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        // 2. Trouver ou associer le domaine académique
        Domain domain = resolveDomain(domaineRecherche);

        // 3. Créer l'entité Publication
        String slug = generateSlug(titre);
        Publication publication = Publication.builder()
                .title(titre)
                .slug(slug)
                .abstractText(resume)
                .type(PublicationType.ARTICLE)
                .status(PublicationStatus.DRAFT)
                .accessLevel(AccessLevel.PUBLIC)
                .domain(domain)
                .language("fr")
                .supervisor(notes)
                .viewCount(0)
                .downloadCount(0)
                .build();
        publication = publicationRepository.save(publication);

        // 4. Auteur principal
        PublicationAuthor author = PublicationAuthor.builder()
                .publication(publication)
                .user(submitter)
                .authorName(auteurPrincipal != null && !auteurPrincipal.trim().isEmpty() ? auteurPrincipal : submitter.getEmail())
                .role("PRINCIPAL_AUTHOR")
                .position(0)
                .build();
        authorRepository.save(author);

        // CoAuteurs éventuels
        if (coAuteurs != null) {
            int pos = 1;
            for (String coAuthorName : coAuteurs) {
                if (coAuthorName != null && !coAuthorName.trim().isEmpty()) {
                    PublicationAuthor coAuthor = PublicationAuthor.builder()
                            .publication(publication)
                            .authorName(coAuthorName.trim())
                            .role("CO_AUTHOR")
                            .position(pos++)
                            .build();
                    authorRepository.save(coAuthor);
                }
            }
        }

        // 5. Mots-clés
        if (motsCles != null) {
            for (String kwStr : motsCles) {
                if (kwStr != null && !kwStr.trim().isEmpty()) {
                    String cleanKw = kwStr.trim();
                    Keyword keyword = keywordRepository.findByLabelIgnoreCase(cleanKw)
                            .orElseGet(() -> keywordRepository.save(Keyword.builder()
                                    .label(cleanKw)
                                    .slug(generateSlug(cleanKw))
                                    .build()));

                    PublicationKeyword pk = PublicationKeyword.builder()
                            .id(new PublicationKeywordId(publication.getId(), keyword.getId()))
                            .publication(publication)
                            .keyword(keyword)
                            .build();
                    publicationKeywordRepository.save(pk);
                }
            }
        }

        // 6. Enregistrement sécurisé du document via StorageService
        String cleanOriginalName = file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_") : "doc.pdf";
        String fileKey = "publications/" + publication.getId() + "/" + UUID.randomUUID() + ".pdf";
        try (InputStream is = file.getInputStream()) {
            storageService.uploadFile(fileKey, is, file.getSize(), "application/pdf");
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier PDF", e);
        }

        Document document = Document.builder()
                .publication(publication)
                .fileName(cleanOriginalName)
                .fileKey(fileKey)
                .fileSize(file.getSize())
                .mimeType("application/pdf")
                .processingStatus(DocumentProcessingStatus.UPLOADED)
                .version(1)
                .build();
        document = documentRepository.save(document);

        // 7. Créer la soumission
        Submission submission = Submission.builder()
                .publication(publication)
                .submittedBy(submitter)
                .status(SubmissionStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .reviewerNotes(notes)
                .build();
        submission = submissionRepository.save(submission);

        // 8. Déclenchement du pipeline d'indexation asynchrone (PENDING -> ANALYZING -> UNDER_REVIEW)
        documentProcessingService.processDocumentAsync(document.getId(), submission.getId());

        // 9. Notification de confirmation de dépôt
        notifyUser(
                submitter,
                NotificationType.SUBMISSION,
                "Soumission enregistrée",
                "Votre travail académique « " + publication.getTitle() + " » a bien été reçu et est en cours d'indexation et d'analyse."
        );

        log.info("Nouvelle soumission #{} créée par l'utilisateur #{} pour la publication #{}",
                submission.getId(), userId, publication.getId());

        return toSubmissionMap(submission);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMySubmissions(Long userId) {
        List<Submission> submissions = submissionRepository.findBySubmittedByIdOrderBySubmittedAtDesc(userId);
        return submissions.stream().map(this::toSubmissionMap).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSubmissionById(Long id, Long userId, boolean isAdminOrStaff) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Soumission", "id", id));

        if (!isAdminOrStaff && !submission.getSubmittedBy().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'avez pas accès à cette soumission");
        }

        return toSubmissionMap(submission);
    }

    @Transactional
    public void deleteSubmission(Long id, Long userId) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Soumission", "id", id));

        if (!submission.getSubmittedBy().getId().equals(userId)) {
            throw new ForbiddenException("Vous ne pouvez supprimer que vos propres soumissions");
        }

        if (submission.getStatus() != SubmissionStatus.PENDING) {
            throw new BadRequestException("Seules les soumissions en attente peuvent être retirées");
        }

        submissionRepository.delete(submission);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingSubmissions() {
        return submissionRepository.findByStatus(SubmissionStatus.PENDING).stream()
                .map(this::toSubmissionMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSubmissionsByStatus(SubmissionStatus status) {
        List<Submission> list = status != null
                ? submissionRepository.findByStatus(status)
                : submissionRepository.findAll();
        return list.stream().map(this::toSubmissionMap).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Number> getStatistics() {
        long pending = submissionRepository.countByStatus(SubmissionStatus.PENDING);
        long analyzing = submissionRepository.countByStatus(SubmissionStatus.ANALYZING);
        long underReview = submissionRepository.countByStatus(SubmissionStatus.UNDER_REVIEW);
        long accepted = submissionRepository.countByStatus(SubmissionStatus.ACCEPTED);
        long rejected = submissionRepository.countByStatus(SubmissionStatus.REJECTED);
        long total = submissionRepository.count();

        Map<String, Number> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("enAttente", pending);
        stats.put("EN_ATTENTE", pending);
        stats.put("analyzing", analyzing);
        stats.put("underReview", underReview);
        stats.put("acceptees", accepted);
        stats.put("ACCEPTEE", accepted);
        stats.put("rejetees", rejected);
        stats.put("REJETEE", rejected);
        return stats;
    }

    @Transactional
    public Map<String, Object> validateSubmission(Long id, Long reviewerId, String commentaire) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Soumission", "id", id));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Évaluateur", "id", reviewerId));

        if (reviewer.getRole() != Role.STAFF && reviewer.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Seul le personnel STAFF ou ADMIN peut valider une soumission");
        }

        submission.setStatus(SubmissionStatus.ACCEPTED);
        submission.setReviewer(reviewer);
        submission.setReviewerNotes(commentaire != null ? commentaire.trim() : "Validé pour publication");
        submission.setReviewedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        // Mettre à jour et publier la publication liée
        Publication publication = submission.getPublication();
        publication.setStatus(PublicationStatus.PUBLISHED);
        publication.setPublishedAt(LocalDateTime.now());
        publicationRepository.save(publication);

        // Notifier l'auteur
        notifyUser(
                submission.getSubmittedBy(),
                NotificationType.PUBLICATION_APPROVED,
                "Publication approuvée",
                "Félicitations ! Votre publication « " + publication.getTitle() + " » a été approuvée par l'équipe éditoriale et est désormais publique."
        );

        log.info("Soumission #{} validée et publiée par l'évaluateur #{} ({})", id, reviewerId, reviewer.getEmail());
        return toSubmissionMap(submission);
    }

    @Transactional
    public Map<String, Object> rejectSubmission(Long id, Long reviewerId, String motif) {
        if (motif == null || motif.trim().isEmpty()) {
            throw new BadRequestException("Le motif de rejet est obligatoire pour toute décision défavorable");
        }

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Soumission", "id", id));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Évaluateur", "id", reviewerId));

        if (reviewer.getRole() != Role.STAFF && reviewer.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Seul le personnel STAFF ou ADMIN peut rejeter une soumission");
        }

        submission.setStatus(SubmissionStatus.REJECTED);
        submission.setReviewer(reviewer);
        submission.setReviewerNotes(motif.trim());
        submission.setReviewedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        // Notifier l'auteur avec le motif obligatoire
        notifyUser(
                submission.getSubmittedBy(),
                NotificationType.PUBLICATION_REJECTED,
                "Décision éditoriale sur votre soumission",
                "Votre soumission « " + submission.getPublication().getTitle() + " » n'a pas été retenue pour publication. Motif : " + motif.trim()
        );

        log.info("Soumission #{} rejetée par l'évaluateur #{}. Motif : {}", id, reviewerId, motif.trim());
        return toSubmissionMap(submission);
    }

    @Transactional
    public Map<String, Object> requestRevision(Long id, Long reviewerId, String commentaire) {
        if (commentaire == null || commentaire.trim().isEmpty()) {
            throw new BadRequestException("Les remarques et révisions demandées doivent être précisées");
        }

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Soumission", "id", id));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Évaluateur", "id", reviewerId));

        if (reviewer.getRole() != Role.STAFF && reviewer.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Seul le personnel STAFF ou ADMIN peut demander des révisions");
        }

        submission.setStatus(SubmissionStatus.UNDER_REVIEW);
        submission.setReviewer(reviewer);
        submission.setReviewerNotes(commentaire.trim());
        submission.setReviewedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        // Notifier l'auteur
        notifyUser(
                submission.getSubmittedBy(),
                NotificationType.REVISION_REQUESTED,
                "Demande de révision éditoriale",
                "Des modifications ont été demandées pour votre travail « " + submission.getPublication().getTitle() + " » : " + commentaire.trim()
        );

        return toSubmissionMap(submission);
    }

    @Transactional
    public Map<String, Object> retrySubmissionProcessing(Long submissionId, Long userId, boolean isAdminOrStaff) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Soumission", "id", submissionId));

        if (!isAdminOrStaff && !submission.getSubmittedBy().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation de relancer cette soumission");
        }

        List<Document> docs = documentRepository.findByPublicationId(submission.getPublication().getId());
        if (docs.isEmpty()) {
            throw new BadRequestException("Aucun document associé trouvé pour cette soumission");
        }

        Document doc = docs.get(0);
        doc.setProcessingStatus(DocumentProcessingStatus.UPLOADED);
        doc.setProcessingError(null);
        documentRepository.save(doc);

        submission.setStatus(SubmissionStatus.ANALYZING);
        submissionRepository.save(submission);

        documentProcessingService.processDocumentAsync(doc.getId(), submission.getId());
        log.info("Relance du traitement pour la soumission #{} (document #{})", submissionId, doc.getId());

        return toSubmissionMap(submission);
    }

    private void notifyUser(User user, NotificationType type, String title, String message) {
        try {
            Notification notification = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.warn("Impossible d'enregistrer la notification pour l'utilisateur #{}: {}", user.getId(), e.getMessage());
        }
    }

    private void validatePdfFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Seuls les fichiers au format PDF sont autorisés");
        }

        if (file.getSize() > 50 * 1024 * 1024) {
            throw new BadRequestException("Le fichier dépasse la taille maximale de 50 Mo");
        }

        // Vérification de la signature magique %PDF-
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[5];
            int read = is.read(header);
            if (read < 4 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F') {
                throw new BadRequestException("Le fichier envoyé n'est pas un document PDF valide");
            }
        } catch (IOException e) {
            throw new BadRequestException("Impossible d'analyser le contenu du fichier");
        }
    }

    private Domain resolveDomain(String nameOrSlug) {
        if (nameOrSlug == null || nameOrSlug.trim().isEmpty()) {
            throw new BadRequestException("Le domaine de recherche est obligatoire");
        }
        String clean = nameOrSlug.trim();
        return domainRepository.findBySlug(clean)
                .or(() -> domainRepository.findByNameIgnoreCase(clean))
                .orElseThrow(() -> new BadRequestException("Le domaine de recherche sélectionné est inconnu"));
    }

    private String generateSlug(String input) {
        if (input == null) return UUID.randomUUID().toString();
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = normalized.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return (slug.isEmpty() ? "pub" : slug) + "-" + System.currentTimeMillis() % 100000;
    }

    public Map<String, Object> toSubmissionMap(Submission s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("status", s.getStatus() != null ? s.getStatus().name() : "PENDING");
        map.put("statut", s.getStatus() != null ? s.getStatus().name() : "PENDING");
        map.put("submittedAt", s.getSubmittedAt());
        map.put("dateCreation", s.getSubmittedAt() != null ? s.getSubmittedAt().toString() : "");
        map.put("reviewedAt", s.getReviewedAt());
        map.put("reviewerNotes", s.getReviewerNotes());
        map.put("commentaire", s.getReviewerNotes());
        map.put("aiAnalysis", s.getAiAnalysis());

        if (s.getReviewer() != null) {
            map.put("reviewerId", s.getReviewer().getId());
            map.put("reviewerEmail", s.getReviewer().getEmail());
        }

        if (s.getPublication() != null) {
            Publication pub = s.getPublication();
            map.put("publicationId", pub.getId());
            map.put("titre", pub.getTitle());
            map.put("title", pub.getTitle());
            map.put("resume", pub.getAbstractText());
            map.put("abstractText", pub.getAbstractText());
            map.put("domaine", pub.getDomain() != null ? pub.getDomain().getName() : "");
            map.put("domaineRecherche", pub.getDomain() != null ? pub.getDomain().getName() : "");
            map.put("domain", pub.getDomain() != null ? pub.getDomain().getName() : "");

            List<Document> docs = documentRepository.findByPublicationId(pub.getId());
            if (!docs.isEmpty()) {
                Document doc = docs.get(0);
                map.put("documentId", doc.getId());
                map.put("documentStatus", doc.getProcessingStatus().name());
                map.put("processingStatus", doc.getProcessingStatus().name());
                map.put("processingError", doc.getProcessingError());
                map.put("pageCount", doc.getPageCount());
                map.put("fileName", doc.getFileName());
                map.put("fileSize", doc.getFileSize());
            }
        }

        if (s.getSubmittedBy() != null) {
            map.put("submittedBy", s.getSubmittedBy().getEmail());
            map.put("auteurPrincipal", s.getSubmittedBy().getEmail());
            map.put("userId", s.getSubmittedBy().getId());
        }

        return map;
    }
}
