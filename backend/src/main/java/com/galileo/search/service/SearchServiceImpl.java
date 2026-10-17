package com.galileo.search.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.embedding.provider.EmbeddingProvider;
import com.galileo.publications.dto.PublicationDTO;
import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationAuthor;
import com.galileo.publications.entity.PublicationKeyword;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.entity.PublicationType;
import com.galileo.publications.repository.*;
import com.galileo.recommendations.entity.SearchHistory;
import com.galileo.recommendations.repository.SearchHistoryRepository;
import com.galileo.search.dto.SearchRequest;
import com.galileo.search.dto.SearchResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final PublicationKeywordRepository keywordRepository;
    private final DomainRepository domainRepository;
    private final EmbeddingProvider embeddingProvider;
    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public SearchResult search(SearchRequest request) {
        return search(request, null);
    }

    @Override
    @Transactional
    public SearchResult search(SearchRequest request, CustomUserDetails currentUser) {
        int page = Math.max(0, request.getPage());
        int size = request.getSize() > 0 ? Math.min(request.getSize(), 50) : 20;

        String sortField = request.getSortBy() != null ? request.getSortBy() : "publishedAt";
        boolean asc = "asc".equalsIgnoreCase(request.getDirection());
        Sort sort = asc ? Sort.by(sortField).ascending() : Sort.by(sortField).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String queryText = request.getEffectiveQuery();

        // 1. Filtrage multi-critères
        List<Publication> candidates = publicationRepository.findAll();

        List<Publication> filtered = candidates.stream()
                .filter(p -> isAuthorized(p, currentUser))
                .filter(p -> {
                    // Statut de publication
                    if (currentUser == null || (currentUser.getRole() != Role.STAFF && currentUser.getRole() != Role.ADMIN)) {
                        if (p.getStatus() != PublicationStatus.PUBLISHED) return false;
                    }

                    // Requête textuelle (titre, résumé, méthodologie, encadreur)
                    if (queryText != null && !queryText.isEmpty()) {
                        String q = queryText.toLowerCase();
                        boolean matchTitle = p.getTitle() != null && p.getTitle().toLowerCase().contains(q);
                        boolean matchAbstract = p.getAbstractText() != null && p.getAbstractText().toLowerCase().contains(q);
                        boolean matchSupervisor = p.getSupervisor() != null && p.getSupervisor().toLowerCase().contains(q);
                        boolean matchMethodology = p.getMethodology() != null && p.getMethodology().toLowerCase().contains(q);

                        // Auteurs
                        boolean matchAuthors = authorRepository.findByPublicationIdOrderByPositionAsc(p.getId()).stream()
                                .anyMatch(a -> a.getAuthorName() != null && a.getAuthorName().toLowerCase().contains(q));

                        // Mots-clés
                        boolean matchKeywords = keywordRepository.findByPublicationId(p.getId()).stream()
                                .anyMatch(k -> k.getKeyword().getLabel().toLowerCase().contains(q));

                        if (!matchTitle && !matchAbstract && !matchSupervisor && !matchMethodology && !matchAuthors && !matchKeywords) {
                            return false;
                        }
                    }

                    // Filtre Titre spécifique
                    if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
                        if (p.getTitle() == null || !p.getTitle().toLowerCase().contains(request.getTitle().trim().toLowerCase())) {
                            return false;
                        }
                    }

                    // Filtre Auteur spécifique
                    if (request.getAuthor() != null && !request.getAuthor().trim().isEmpty()) {
                        String aQ = request.getAuthor().trim().toLowerCase();
                        boolean match = authorRepository.findByPublicationIdOrderByPositionAsc(p.getId()).stream()
                                .anyMatch(a -> a.getAuthorName() != null && a.getAuthorName().toLowerCase().contains(aQ));
                        if (!match) return false;
                    }

                    // Filtre Domaine
                    if (request.getDomainId() != null) {
                        if (p.getDomain() == null || !p.getDomain().getId().equals(request.getDomainId())) {
                            return false;
                        }
                    } else if (request.getDomain() != null && !request.getDomain().trim().isEmpty()) {
                        String dQ = request.getDomain().trim().toLowerCase();
                        if (p.getDomain() == null ||
                                (!p.getDomain().getName().toLowerCase().contains(dQ) && !p.getDomain().getSlug().equalsIgnoreCase(dQ))) {
                            return false;
                        }
                    }

                    // Filtre Type
                    if (request.getType() != null && !request.getType().trim().isEmpty()) {
                        try {
                            PublicationType pt = PublicationType.valueOf(request.getType().trim().toUpperCase());
                            if (p.getType() != pt) return false;
                        } catch (IllegalArgumentException ignored) {}
                    }

                    // Filtre Institution
                    if (request.getInstitutionId() != null) {
                        if (p.getInstitution() == null || !p.getInstitution().getId().equals(request.getInstitutionId())) {
                            return false;
                        }
                    } else if (request.getInstitution() != null && !request.getInstitution().trim().isEmpty()) {
                        String instQ = request.getInstitution().trim().toLowerCase();
                        if (p.getInstitution() == null || !p.getInstitution().getName().toLowerCase().contains(instQ)) {
                            return false;
                        }
                    }

                    // Filtre Langue
                    if (request.getLanguage() != null && !request.getLanguage().trim().isEmpty()) {
                        if (p.getLanguage() == null || !p.getLanguage().equalsIgnoreCase(request.getLanguage().trim())) {
                            return false;
                        }
                    }

                    // Filtre Année académique
                    if (request.getAcademicYear() != null && !request.getAcademicYear().trim().isEmpty()) {
                        if (p.getAcademicYear() == null || !p.getAcademicYear().contains(request.getAcademicYear().trim())) {
                            return false;
                        }
                    }

                    return true;
                })
                .collect(Collectors.toList());

        // Tri
        Comparator<Publication> comparator = Comparator.comparing(
                p -> p.getPublishedAt() != null ? p.getPublishedAt() : (p.getCreatedAt() != null ? p.getCreatedAt() : java.time.LocalDateTime.MIN)
        );
        if ("viewCount".equalsIgnoreCase(sortField)) {
            comparator = Comparator.comparingInt(p -> p.getViewCount() != null ? p.getViewCount() : 0);
        } else if ("downloadCount".equalsIgnoreCase(sortField)) {
            comparator = Comparator.comparingInt(p -> p.getDownloadCount() != null ? p.getDownloadCount() : 0);
        } else if ("title".equalsIgnoreCase(sortField)) {
            comparator = Comparator.comparing(Publication::getTitle, String.CASE_INSENSITIVE_ORDER);
        }
        if (!asc) {
            comparator = comparator.reversed();
        }
        filtered.sort(comparator);

        // Pagination
        int totalHits = filtered.size();
        int fromIndex = Math.min(page * size, totalHits);
        int toIndex = Math.min(fromIndex + size, totalHits);
        List<Publication> subList = filtered.subList(fromIndex, toIndex);

        List<PublicationDTO> dtos = subList.stream().map(this::toDTO).toList();

        // Enregistrement de l'historique de recherche pour les utilisateurs connectés
        if (currentUser != null && queryText != null && !queryText.isEmpty()) {
            recordSearchHistory(currentUser.getId(), queryText, request, totalHits);
        }

        int totalPages = (int) Math.ceil((double) totalHits / size);
        return SearchResult.builder()
                .publications(dtos)
                .totalHits(totalHits)
                .page(page)
                .totalPages(totalPages)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SearchResult semanticSearch(String query, int limit) {
        return semanticSearch(query, limit, null);
    }

    @Override
    @Transactional(readOnly = true)
    public SearchResult semanticSearch(String query, int limit, CustomUserDetails currentUser) {
        if (query == null || query.trim().isEmpty()) {
            return SearchResult.builder()
                    .publications(Collections.emptyList())
                    .totalHits(0)
                    .page(0)
                    .totalPages(0)
                    .build();
        }

        int fetchLimit = limit > 0 ? Math.min(limit, 30) : 10;

        float[] queryEmbedding;
        try {
            // 1. Vectorisation de la requête avec Qwen text-embedding-v4 (dimension 1024)
            queryEmbedding = embeddingProvider.generateEmbedding(query.trim());
        } catch (Exception e) {
            log.warn("Fournisseur d'embeddings Qwen non disponible pour la recherche sémantique : {}. Bascule sur la recherche multi-critères.", e.getMessage());
            return search(SearchRequest.builder().query(query).page(0).size(fetchLimit).build(), currentUser);
        }

        if (queryEmbedding == null || queryEmbedding.length != embeddingProvider.getDimension()) {
            log.warn("Embedding invalide généré pour la requête. Bascule sur la recherche multi-critères.");
            return search(SearchRequest.builder().query(query).page(0).size(fetchLimit).build(), currentUser);
        }

        List<PublicationDTO> results = new ArrayList<>();

        // 2. Véritable recherche par similarité vectorielle pgvector
        try {
            String vectorStr = Arrays.toString(queryEmbedding);
            String nativeSql = """
                SELECT p.id, MIN(de.embedding <=> cast(:vectorStr as vector)) as dist
                FROM document_embeddings de
                JOIN document_chunks dc ON de.chunk_id = dc.id
                JOIN documents d ON dc.document_id = d.id
                JOIN publications p ON d.publication_id = p.id
                WHERE p.status = 'PUBLISHED'
                GROUP BY p.id
                ORDER BY dist ASC
                LIMIT :lim
            """;

            Query nativeQuery = entityManager.createNativeQuery(nativeSql);
            nativeQuery.setParameter("vectorStr", vectorStr);
            nativeQuery.setParameter("lim", fetchLimit * 2);

            @SuppressWarnings("unchecked")
            List<Object[]> rows = nativeQuery.getResultList();

            for (Object[] row : rows) {
                Long pubId = ((Number) row[0]).longValue();
                publicationRepository.findById(pubId).ifPresent(p -> {
                    if (isAuthorized(p, currentUser) && results.size() < fetchLimit) {
                        results.add(toDTO(p));
                    }
                });
            }
        } catch (Exception e) {
            log.warn("Recherche vectorielle native pgvector non disponible, bascule sur la recherche textuelle : {}", e.getMessage());
            return search(SearchRequest.builder().query(query).page(0).size(fetchLimit).build(), currentUser);
        }

        return SearchResult.builder()
                .publications(results)
                .totalHits(results.size())
                .page(0)
                .totalPages(results.isEmpty() ? 0 : 1)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getSuggestions(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        String q = query.trim().toLowerCase();
        Set<String> suggestions = new LinkedHashSet<>();

        // Titres correspondants
        for (Publication p : publicationRepository.findAll()) {
            if (p.getStatus() == PublicationStatus.PUBLISHED && p.getTitle() != null && p.getTitle().toLowerCase().contains(q)) {
                suggestions.add(p.getTitle());
                if (suggestions.size() >= 5) break;
            }
        }

        // Domaines
        domainRepository.findAll().stream()
                .filter(d -> d.getName().toLowerCase().contains(q))
                .forEach(d -> suggestions.add(d.getName()));

        return suggestions.stream().limit(8).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicationDTO> getSimilarPublications(Long publicationId, int limit, CustomUserDetails currentUser) {
        Publication pub = publicationRepository.findById(publicationId).orElse(null);
        if (pub == null) return Collections.emptyList();

        int fetchLimit = limit > 0 ? Math.min(limit, 10) : 5;

        // 1. Chercher dans le même domaine
        List<Publication> similar;
        if (pub.getDomain() != null) {
            similar = publicationRepository.findTop5ByDomainIdAndStatusAndIdNotOrderByViewCountDesc(
                    pub.getDomain().getId(), PublicationStatus.PUBLISHED, publicationId);
        } else {
            similar = publicationRepository.findTop5ByStatusAndIdNotOrderByViewCountDesc(
                    PublicationStatus.PUBLISHED, publicationId);
        }

        return similar.stream()
                .filter(p -> isAuthorized(p, currentUser))
                .limit(fetchLimit)
                .map(this::toDTO)
                .toList();
    }

    private boolean isAuthorized(Publication pub, CustomUserDetails user) {
        if (pub == null) return false;
        if (user != null && (user.getRole() == Role.STAFF || user.getRole() == Role.ADMIN)) {
            return true;
        }
        if (user != null) {
            boolean isAuthor = authorRepository.findByPublicationIdOrderByPositionAsc(pub.getId()).stream()
                    .anyMatch(a -> a.getUser() != null && a.getUser().getId().equals(user.getId()));
            if (isAuthor) return true;
        }
        if (pub.getStatus() != PublicationStatus.PUBLISHED) {
            return false;
        }
        if (pub.getAccessLevel() == AccessLevel.PUBLIC) {
            return true;
        }
        if (pub.getAccessLevel() == AccessLevel.INSTITUTIONAL) {
            return user != null;
        }
        return false;
    }

    private void recordSearchHistory(Long userId, String query, SearchRequest req, int resultCount) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                String filterJson = objectMapper.writeValueAsString(Map.of(
                        "domain", req.getDomain() != null ? req.getDomain() : "",
                        "type", req.getType() != null ? req.getType() : ""
                ));
                SearchHistory history = SearchHistory.builder()
                        .user(user)
                        .query(query)
                        .filters(filterJson)
                        .resultCount(resultCount)
                        .build();
                searchHistoryRepository.save(history);
            }
        } catch (Exception e) {
            log.warn("Impossible d'enregistrer l'historique de recherche : {}", e.getMessage());
        }
    }

    private PublicationDTO toDTO(Publication p) {
        List<PublicationAuthor> authors = authorRepository.findByPublicationIdOrderByPositionAsc(p.getId());
        List<PublicationKeyword> pks = keywordRepository.findByPublicationId(p.getId());

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
