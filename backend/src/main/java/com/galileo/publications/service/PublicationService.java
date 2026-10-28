package com.galileo.publications.service;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.entity.Document;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.publications.dto.PublicationCreateDTO;
import com.galileo.publications.dto.PublicationDetailDTO;
import com.galileo.publications.entity.*;
import com.galileo.publications.repository.*;
import com.galileo.storage.service.StorageService;
import com.galileo.users.entity.Institution;
import com.galileo.users.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final PublicationKeywordRepository keywordRepository;
    private final KeywordRepository mainKeywordRepository;
    private final DomainRepository domainRepository;
    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getPublishedPublications(Pageable pageable, CustomUserDetails currentUser) {
        Page<Publication> page;
        if (currentUser != null && (currentUser.getRole() == Role.STAFF || currentUser.getRole() == Role.ADMIN)) {
            page = publicationRepository.findAll(pageable);
        } else {
            page = publicationRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
        }
        return page.map(p -> toMapResponse(p, currentUser));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPublications(String q, String domain, String type, String year, String lang, int page, int size) {
        return Collections.emptyMap();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPublicationById(Long id, CustomUserDetails currentUser) {
        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", id));

        if (!isAuthorizedToAccess(pub, currentUser)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette publication");
        }

        return toMapResponse(pub, currentUser);
    }

    @Transactional(readOnly = true)
    public PublicationDetailDTO getPublicationDetail(Long id, CustomUserDetails currentUser) {
        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", id));

        if (!isAuthorizedToAccess(pub, currentUser)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette publication");
        }

        return toDetailDTO(pub);
    }

    @Transactional
    public Map<String, Object> createPublication(PublicationCreateDTO dto, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        Domain domain = null;
        if (dto.getDomainId() != null) {
            domain = domainRepository.findById(dto.getDomainId()).orElse(null);
        }

        Institution institution = null;
        if (dto.getInstitutionId() != null) {
            institution = institutionRepository.findById(dto.getInstitutionId()).orElse(null);
        }

        String slug = generateSlug(dto.getTitle());

        Publication publication = Publication.builder()
                .title(dto.getTitle())
                .slug(slug)
                .abstractText(dto.getAbstractText())
                .type(dto.getType() != null ? dto.getType() : PublicationType.ARTICLE)
                .status(PublicationStatus.DRAFT)
                .accessLevel(dto.getAccessLevel() != null ? dto.getAccessLevel() : AccessLevel.PUBLIC)
                .domain(domain)
                .institution(institution)
                .language(dto.getLanguage() != null ? dto.getLanguage() : "fr")
                .academicYear(dto.getAcademicYear())
                .supervisor(dto.getSupervisor())
                .methodology(dto.getMethodology())
                .doi(dto.getDoi())
                .license(dto.getLicense())
                .referencesText(dto.getReferencesText())
                .viewCount(0)
                .downloadCount(0)
                .build();

        publication = publicationRepository.save(publication);

        // Association auteur principal
        PublicationAuthor author = PublicationAuthor.builder()
                .publication(publication)
                .user(creator)
                .authorName(creator.getEmail())
                .role("PRINCIPAL_AUTHOR")
                .position(0)
                .build();
        authorRepository.save(author);

        // Co-auteurs optionnels
        if (dto.getAuthors() != null) {
            int pos = 1;
            for (String authorName : dto.getAuthors()) {
                if (authorName != null && !authorName.trim().isEmpty() && !authorName.equalsIgnoreCase(creator.getEmail())) {
                    authorRepository.save(PublicationAuthor.builder()
                            .publication(publication)
                            .authorName(authorName.trim())
                            .role("CO_AUTHOR")
                            .position(pos++)
                            .build());
                }
            }
        }

        // Mots-clés
        attachKeywords(publication, dto.getKeywords());

        log.info("Publication #{} (« {} ») créée avec succès par l'utilisateur #{}", publication.getId(), publication.getTitle(), userId);
        return toMapResponse(publication, null);
    }

    @Transactional
    public Map<String, Object> updatePublication(Long id, PublicationCreateDTO dto, CustomUserDetails user) {
        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", id));

        if (!canModify(publication, user)) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette publication");
        }

        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            publication.setTitle(dto.getTitle().trim());
        }
        if (dto.getAbstractText() != null) {
            publication.setAbstractText(dto.getAbstractText());
        }
        if (dto.getType() != null) {
            publication.setType(dto.getType());
        }
        if (dto.getAccessLevel() != null) {
            publication.setAccessLevel(dto.getAccessLevel());
        }
        if (dto.getDomainId() != null) {
            domainRepository.findById(dto.getDomainId()).ifPresent(publication::setDomain);
        }
        if (dto.getInstitutionId() != null) {
            institutionRepository.findById(dto.getInstitutionId()).ifPresent(publication::setInstitution);
        }
        if (dto.getLanguage() != null) {
            publication.setLanguage(dto.getLanguage());
        }
        if (dto.getAcademicYear() != null) {
            publication.setAcademicYear(dto.getAcademicYear());
        }
        if (dto.getSupervisor() != null) {
            publication.setSupervisor(dto.getSupervisor());
        }
        if (dto.getMethodology() != null) {
            publication.setMethodology(dto.getMethodology());
        }
        if (dto.getDoi() != null) {
            publication.setDoi(dto.getDoi());
        }
        if (dto.getLicense() != null) {
            publication.setLicense(dto.getLicense());
        }
        if (dto.getReferencesText() != null) {
            publication.setReferencesText(dto.getReferencesText());
        }

        publication = publicationRepository.save(publication);

        if (dto.getKeywords() != null) {
            List<PublicationKeyword> existing = keywordRepository.findByPublicationId(publication.getId());
            if (!existing.isEmpty()) {
                keywordRepository.deleteAllInBatch(existing);
                keywordRepository.flush();
            }
            attachKeywords(publication, dto.getKeywords());
        }

        return toMapResponse(publication, user);
    }

    @Transactional
    public void updatePublicationStatus(Long id, PublicationStatus newStatus, CustomUserDetails user) {
        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", id));

        boolean isStaffOrAdmin = user != null && (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN);

        // Seul le staff peut publier directement une publication
        if (newStatus == PublicationStatus.PUBLISHED && !isStaffOrAdmin) {
            throw new ForbiddenException("La publication directe est réservée aux modérateurs (STAFF ou ADMIN)");
        }

        // L'auteur peut archiver son propre travail
        if (!isStaffOrAdmin && !canModify(publication, user)) {
            throw new ForbiddenException("Privilèges insuffisants pour changer le statut de cette publication");
        }

        publication.setStatus(newStatus);
        if (newStatus == PublicationStatus.PUBLISHED && publication.getPublishedAt() == null) {
            publication.setPublishedAt(LocalDateTime.now());
        }
        publicationRepository.save(publication);
        log.info("Statut de la publication #{} changé vers {}", id, newStatus);
    }

    @Transactional
    public void deletePublication(Long id, CustomUserDetails user) {
        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", id));

        boolean isStaffOrAdmin = user != null && (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN);

        if (!isStaffOrAdmin && !canModify(publication, user)) {
            throw new ForbiddenException("Privilèges insuffisants pour supprimer cette publication");
        }

        // Si la publication est déjà publiée, seule une équipe STAFF/ADMIN peut la supprimer définitivement
        if (publication.getStatus() == PublicationStatus.PUBLISHED && !isStaffOrAdmin) {
            throw new BadRequestException("Une publication publique validée ne peut être supprimée que par un administrateur");
        }

        publicationRepository.delete(publication);
        log.info("Publication #{} supprimée par {}", id, user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentPublications(CustomUserDetails currentUser) {
        return publicationRepository.findTop10ByStatusOrderByPublishedAtDesc(PublicationStatus.PUBLISHED)
                .stream()
                .filter(p -> isAuthorizedToAccess(p, currentUser))
                .map(p -> toMapResponse(p, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPopularPublications(CustomUserDetails currentUser) {
        return publicationRepository.findTop10ByStatusOrderByViewCountDesc(PublicationStatus.PUBLISHED)
                .stream()
                .filter(p -> isAuthorizedToAccess(p, currentUser))
                .map(p -> toMapResponse(p, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getByDomain(String domain, Pageable pageable, CustomUserDetails currentUser) {
        return publicationRepository.findByDomainNameOrSlug(PublicationStatus.PUBLISHED, domain, pageable)
                .map(p -> toMapResponse(p, currentUser));
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getByAuthor(String author, Pageable pageable, CustomUserDetails currentUser) {
        return publicationRepository.findByAuthorName(PublicationStatus.PUBLISHED, author, pageable)
                .map(p -> toMapResponse(p, currentUser));
    }

    @Transactional
    public void incrementViews(Long id) {
        publicationRepository.findById(id).ifPresent(pub -> {
            pub.setViewCount((pub.getViewCount() != null ? pub.getViewCount() : 0) + 1);
            publicationRepository.save(pub);
        });
    }

    @Transactional
    public void incrementDownloads(Long id) {
        publicationRepository.findById(id).ifPresent(pub -> {
            pub.setDownloadCount((pub.getDownloadCount() != null ? pub.getDownloadCount() : 0) + 1);
            publicationRepository.save(pub);
        });
    }

    @Transactional(readOnly = true)
    public String getDownloadUrl(Long publicationId, CustomUserDetails currentUser) {
        Publication pub = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));

        if (!isAuthorizedToReadFullDocument(pub, currentUser)) {
            throw new ForbiddenException("Téléchargement non autorisé pour cette publication");
        }

        List<Document> docs = documentRepository.findByPublicationId(publicationId);
        if (docs.isEmpty()) {
            throw new ResourceNotFoundException("Document", "publicationId", publicationId);
        }

        Document doc = docs.get(0);
        return "/api/documents/" + doc.getId() + "/download";
    }

    public boolean isAuthorizedToAccess(Publication pub, CustomUserDetails user) {
        if (pub == null) return false;

        // STAFF et ADMIN ont accès à tout
        if (user != null && (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN)) {
            return true;
        }

        // Auteur
        if (isAuthenticatedMember(user)) {
            boolean isAuthor = authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId()).stream()
                    .anyMatch(a -> a.getUser() != null && a.getUser().getId().equals(user.getId()));
            if (isAuthor) return true;
        }

        // Si non publiée, restreint à l'auteur/staff
        if (pub.getStatus() != PublicationStatus.PUBLISHED) {
            return false;
        }

        // Niveau d'accès
        if (pub.getAccessLevel() == AccessLevel.PUBLIC) {
            return true;
        }
        if (pub.getAccessLevel() == AccessLevel.INSTITUTIONAL) {
            return isAuthenticatedMember(user);
        }

        return false;
    }

    public boolean isAuthorizedToReadFullDocument(Publication pub, CustomUserDetails user) {
        if (pub == null || !isAuthenticatedMember(user)) {
            return false;
        }

        if (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN) {
            return true;
        }

        boolean isAuthor = authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId()).stream()
                .anyMatch(author -> author.getUser() != null && author.getUser().getId().equals(user.getId()));
        if (isAuthor) {
            return true;
        }

        if (pub.getStatus() != PublicationStatus.PUBLISHED) {
            return false;
        }

        return pub.getAccessLevel() == AccessLevel.PUBLIC
                || pub.getAccessLevel() == AccessLevel.INSTITUTIONAL;
    }

    private boolean isAuthenticatedMember(CustomUserDetails user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return switch (user.getRole()) {
            case STUDENT, RESEARCHER, TEACHER, STAFF, ADMIN -> true;
            default -> false;
        };
    }

    private boolean canModify(Publication pub, CustomUserDetails user) {
        if (!isAuthenticatedMember(user)) return false;
        if (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN) return true;
        return authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId()).stream()
                .anyMatch(a -> a.getUser() != null && a.getUser().getId().equals(user.getId()));
    }

    private void attachKeywords(Publication publication, List<String> keywords) {
        if (keywords == null) return;
        Set<Long> attachedKeywordIds = new HashSet<>();
        for (String kwStr : keywords) {
            if (kwStr != null && !kwStr.trim().isEmpty()) {
                String clean = kwStr.trim();
                Keyword keyword = mainKeywordRepository.findByLabelIgnoreCase(clean)
                        .orElseGet(() -> mainKeywordRepository.save(Keyword.builder()
                                .label(clean)
                                .slug(generateSlug(clean))
                                .build()));

                if (keyword.getId() != null && !attachedKeywordIds.add(keyword.getId())) {
                    continue;
                }

                PublicationKeyword pk = PublicationKeyword.builder()
                        .id(new PublicationKeywordId(publication.getId(), keyword.getId()))
                        .publication(publication)
                        .keyword(keyword)
                        .build();
                keywordRepository.save(pk);
            }
        }
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

    public PublicationDetailDTO toDetailDTO(Publication pub) {
        List<PublicationAuthor> authors = authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId());
        List<PublicationKeyword> pks = keywordRepository.findByPublicationId(pub.getId());

        return PublicationDetailDTO.builder()
                .id(pub.getId())
                .title(pub.getTitle())
                .slug(pub.getSlug())
                .abstractText(pub.getAbstractText())
                .type(pub.getType())
                .status(pub.getStatus())
                .accessLevel(pub.getAccessLevel())
                .domainId(pub.getDomain() != null ? pub.getDomain().getId() : null)
                .domainName(pub.getDomain() != null ? pub.getDomain().getName() : null)
                .institutionId(pub.getInstitution() != null ? pub.getInstitution().getId() : null)
                .institutionName(pub.getInstitution() != null ? pub.getInstitution().getName() : null)
                .language(pub.getLanguage())
                .publishedAt(pub.getPublishedAt())
                .academicYear(pub.getAcademicYear())
                .supervisor(pub.getSupervisor())
                .methodology(pub.getMethodology())
                .doi(pub.getDoi())
                .license(pub.getLicense())
                .referencesText(pub.getReferencesText())
                .viewCount(pub.getViewCount())
                .downloadCount(pub.getDownloadCount())
                .authors(authors.stream().map(PublicationAuthor::getAuthorName).filter(Objects::nonNull).toList())
                .keywords(pks.stream().map(pk -> pk.getKeyword().getLabel()).toList())
                .createdAt(pub.getCreatedAt())
                .updatedAt(pub.getUpdatedAt())
                .build();
    }

    public Map<String, Object> toMapResponse(Publication pub, CustomUserDetails currentUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", pub.getId());
        map.put("title", pub.getTitle());
        map.put("titre", pub.getTitle());
        map.put("slug", pub.getSlug());
        map.put("abstractText", pub.getAbstractText());
        map.put("resume", pub.getAbstractText());
        map.put("type", pub.getType() != null ? pub.getType().name() : "ARTICLE");
        map.put("status", pub.getStatus() != null ? pub.getStatus().name() : "DRAFT");
        map.put("statut", pub.getStatus() != null ? pub.getStatus().name() : "DRAFT");
        map.put("accessLevel", pub.getAccessLevel() != null ? pub.getAccessLevel().name() : "PUBLIC");

        String domainName = pub.getDomain() != null ? pub.getDomain().getName() : "";
        map.put("domain", domainName);
        map.put("domaine", domainName);
        map.put("domainId", pub.getDomain() != null ? pub.getDomain().getId() : null);

        map.put("institution", pub.getInstitution() != null ? pub.getInstitution().getName() : "Faculté Polytechnique - Université Mapon");
        map.put("language", pub.getLanguage() != null ? pub.getLanguage() : "fr");
        map.put("datePublication", pub.getPublishedAt() != null ? pub.getPublishedAt().toString() : (pub.getCreatedAt() != null ? pub.getCreatedAt().toString() : ""));
        map.put("publishedAt", pub.getPublishedAt());
        map.put("academicYear", pub.getAcademicYear());
        map.put("supervisor", pub.getSupervisor());
        map.put("methodology", pub.getMethodology());
        map.put("doi", pub.getDoi());
        map.put("license", pub.getLicense());
        map.put("referencesText", pub.getReferencesText());
        map.put("nombreVues", pub.getViewCount() != null ? pub.getViewCount() : 0);
        map.put("viewCount", pub.getViewCount() != null ? pub.getViewCount() : 0);
        map.put("nombreTelechargements", pub.getDownloadCount() != null ? pub.getDownloadCount() : 0);
        map.put("downloadCount", pub.getDownloadCount() != null ? pub.getDownloadCount() : 0);

        // Auteurs
        List<PublicationAuthor> authors = authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId());
        String principalAuthor = !authors.isEmpty() && authors.get(0).getAuthorName() != null
                ? authors.get(0).getAuthorName()
                : (pub.getSupervisor() != null ? pub.getSupervisor() : "Chercheur Galileo");
        List<String> coAuthors = authors.size() > 1
                ? authors.subList(1, authors.size()).stream().map(PublicationAuthor::getAuthorName).filter(Objects::nonNull).collect(Collectors.toList())
                : Collections.emptyList();

        map.put("auteurPrincipal", principalAuthor);
        map.put("author", principalAuthor);
        map.put("coAuteurs", coAuthors);
        map.put("authors", authors.stream().map(PublicationAuthor::getAuthorName).filter(Objects::nonNull).collect(Collectors.toList()));

        // Mots clés
        List<PublicationKeyword> pks = keywordRepository.findByPublicationId(pub.getId());
        List<String> kwList = pks.stream().map(pk -> pk.getKeyword().getLabel()).collect(Collectors.toList());
        map.put("keywords", kwList);
        map.put("motsCles", String.join(", ", kwList));

        // Document associé
        List<Document> docs = documentRepository.findByPublicationId(pub.getId());
        if (!docs.isEmpty()) {
            Document doc = docs.get(0);
            map.put("documentId", doc.getId());
            map.put("documentStatus", doc.getProcessingStatus().name());
            map.put("urlPdf", isAuthorizedToReadFullDocument(pub, currentUser)
                    ? "/api/documents/" + doc.getId() + "/download"
                    : null);
            map.put("tailleFichier", doc.getFileSize());
            map.put("nombrePages", doc.getPageCount());
        } else {
            map.put("documentId", null);
            map.put("documentStatus", null);
            map.put("urlPdf", null);
            map.put("tailleFichier", null);
            map.put("nombrePages", null);
        }

        return map;
    }
}
