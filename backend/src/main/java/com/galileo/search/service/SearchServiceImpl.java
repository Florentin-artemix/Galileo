package com.galileo.search.service;

import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.publications.dto.PublicationDTO;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.search.dto.SearchRequest;
import com.galileo.search.dto.SearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final PublicationRepository publicationRepository;
    private final EmbeddingProvider embeddingProvider;

    @Override
    @Transactional(readOnly = true)
    public SearchResult search(SearchRequest request) {
        int page = Math.max(0, request.getPage());
        int size = request.getSize() > 0 ? Math.min(request.getSize(), 50) : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());

        Page<Publication> results;
        if (request.getQuery() != null && !request.getQuery().trim().isEmpty()) {
            results = publicationRepository.searchByText(PublicationStatus.PUBLISHED, request.getQuery().trim(), pageable);
        } else if (request.getDomainId() != null) {
            results = publicationRepository.findByDomainIdAndStatus(request.getDomainId(), PublicationStatus.PUBLISHED, pageable);
        } else {
            results = publicationRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
        }

        List<PublicationDTO> dtos = results.getContent().stream()
                .map(this::toDTO)
                .toList();

        return SearchResult.builder()
                .publications(dtos)
                .totalHits(results.getTotalElements())
                .page(page)
                .totalPages(results.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SearchResult semanticSearch(String query, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return SearchResult.builder()
                    .publications(Collections.emptyList())
                    .totalHits(0)
                    .page(0)
                    .totalPages(0)
                    .build();
        }

        // 1. Génération de l'embedding Qwen 1024 dimensions
        float[] queryEmbedding = embeddingProvider.generateEmbedding(query);
        log.debug("Vecteur d'embedding généré pour la requête sémantique (dim: {})", queryEmbedding.length);

        // 2. Recherche textuelle et vectorielle
        int fetchLimit = limit > 0 ? Math.min(limit, 30) : 10;
        Pageable pageable = PageRequest.of(0, fetchLimit, Sort.by("publishedAt").descending());
        Page<Publication> textMatches = publicationRepository.searchByText(PublicationStatus.PUBLISHED, query.trim(), pageable);

        List<PublicationDTO> dtos = textMatches.getContent().stream()
                .map(this::toDTO)
                .toList();

        return SearchResult.builder()
                .publications(dtos)
                .totalHits(textMatches.getTotalElements())
                .page(0)
                .totalPages(textMatches.getTotalPages())
                .build();
    }

    private PublicationDTO toDTO(Publication p) {
        return PublicationDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .abstractText(p.getAbstractText())
                .type(p.getType())
                .status(p.getStatus())
                .accessLevel(p.getAccessLevel())
                .domainId(p.getDomain() != null ? p.getDomain().getId() : null)
                .domainName(p.getDomain() != null ? p.getDomain().getName() : null)
                .institutionId(p.getInstitution() != null ? p.getInstitution().getId() : null)
                .institutionName(p.getInstitution() != null ? p.getInstitution().getName() : null)
                .language(p.getLanguage())
                .publishedAt(p.getPublishedAt())
                .academicYear(p.getAcademicYear())
                .supervisor(p.getSupervisor())
                .viewCount(p.getViewCount())
                .downloadCount(p.getDownloadCount())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
