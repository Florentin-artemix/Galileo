package com.galileo.publications.service;

import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.entity.Document;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.publications.entity.*;
import com.galileo.publications.repository.PublicationAuthorRepository;
import com.galileo.publications.repository.PublicationKeywordRepository;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final PublicationKeywordRepository keywordRepository;
    private final DocumentRepository documentRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getPublishedPublications(Pageable pageable) {
        Page<Publication> page = publicationRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
        return page.map(this::toMapResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPublicationById(Long id) {
        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", id));
        return toMapResponse(pub);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentPublications() {
        return publicationRepository.findTop10ByStatusOrderByPublishedAtDesc(PublicationStatus.PUBLISHED)
                .stream()
                .map(this::toMapResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPopularPublications() {
        return publicationRepository.findTop10ByStatusOrderByViewCountDesc(PublicationStatus.PUBLISHED)
                .stream()
                .map(this::toMapResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getByDomain(String domain, Pageable pageable) {
        return publicationRepository.findByDomainNameOrSlug(PublicationStatus.PUBLISHED, domain, pageable)
                .map(this::toMapResponse);
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getByAuthor(String author, Pageable pageable) {
        return publicationRepository.findByAuthorName(PublicationStatus.PUBLISHED, author, pageable)
                .map(this::toMapResponse);
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
    public String getDownloadUrl(Long publicationId) {
        List<Document> docs = documentRepository.findByPublicationId(publicationId);
        if (docs.isEmpty()) {
            throw new ResourceNotFoundException("Document", "publicationId", publicationId);
        }
        Document doc = docs.get(0);
        return storageService.generatePresignedUrl(doc.getFileKey(), 60);
    }

    public Map<String, Object> toMapResponse(Publication pub) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", pub.getId());
        map.put("title", pub.getTitle());
        map.put("titre", pub.getTitle());
        map.put("slug", pub.getSlug());
        map.put("abstractText", pub.getAbstractText());
        map.put("resume", pub.getAbstractText());
        map.put("type", pub.getType() != null ? pub.getType().name() : "ARTICLE");
        map.put("status", pub.getStatus() != null ? pub.getStatus().name() : "DRAFT");
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
        map.put("doi", pub.getDoi());
        map.put("license", pub.getLicense());
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
            map.put("urlPdf", storageService.generatePresignedUrl(doc.getFileKey(), 60));
            map.put("tailleFichier", doc.getFileSize());
            map.put("nombrePages", doc.getPageCount());
        } else {
            map.put("urlPdf", null);
            map.put("tailleFichier", null);
            map.put("nombrePages", null);
        }

        return map;
    }
}
