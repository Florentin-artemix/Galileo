package com.galileo.search.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.documents.repository.DocumentRepository;
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
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final PublicationRepository publicationRepository;
    private final DocumentRepository documentRepository;
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

        // Requête multi-critères dynamique directement déléguée à PostgreSQL
        Specification<Publication> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Statut : les non-gestionnaires ne voient que les publications approuvées
            if (currentUser == null || (currentUser.getRole() != Role.STAFF && currentUser.getRole() != Role.ADMIN)) {
                predicates.add(cb.equal(root.get("status"), PublicationStatus.PUBLISHED));
            }

            // 2. Niveaux d'accès autorisés
            if (!isAuthenticatedMember(currentUser)) {
                predicates.add(cb.equal(root.get("accessLevel"), AccessLevel.PUBLIC));
            } else if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.STAFF) {
                Subquery<Long> authorSubquery = cq.subquery(Long.class);
                Root<PublicationAuthor> authorRoot = authorSubquery.from(PublicationAuthor.class);
                authorSubquery.select(authorRoot.get("publication").get("id"))
                        .where(cb.equal(authorRoot.get("user").get("id"), currentUser.getId()));

                predicates.add(cb.or(
                        root.get("accessLevel").in(AccessLevel.PUBLIC, AccessLevel.INSTITUTIONAL),
                        root.get("id").in(authorSubquery)
                ));
            }

            // 3. Recherche textuelle (titre, résumé, encadreur, méthodologie)
            if (queryText != null && !queryText.trim().isEmpty()) {
                String pattern = "%" + queryText.trim().toLowerCase() + "%";
                Subquery<Long> authorQuery = cq.subquery(Long.class);
                Root<PublicationAuthor> authorRoot = authorQuery.from(PublicationAuthor.class);
                authorQuery.select(authorRoot.get("publication").get("id"))
                        .where(cb.like(cb.lower(authorRoot.get("authorName")), pattern));
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("abstractText")), pattern),
                        cb.like(cb.lower(root.get("supervisor")), pattern),
                        cb.like(cb.lower(root.get("methodology")), pattern),
                        root.get("id").in(authorQuery)
                ));
            }

            // 4. Filtre Titre spécifique
            if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + request.getTitle().trim().toLowerCase() + "%"));
            }

            // 5. Filtre Auteur spécifique via sous-requête
            if (request.getAuthor() != null && !request.getAuthor().trim().isEmpty()) {
                Subquery<Long> aSub = cq.subquery(Long.class);
                Root<PublicationAuthor> aRoot = aSub.from(PublicationAuthor.class);
                aSub.select(aRoot.get("publication").get("id"))
                        .where(cb.like(cb.lower(aRoot.get("authorName")), "%" + request.getAuthor().trim().toLowerCase() + "%"));
                predicates.add(root.get("id").in(aSub));
            }

            // 6. Filtre Domaine
            if (request.getDomainId() != null) {
                predicates.add(cb.equal(root.get("domain").get("id"), request.getDomainId()));
            } else if (request.getDomain() != null && !request.getDomain().trim().isEmpty()) {
                String dQ = "%" + request.getDomain().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("domain").get("name")), dQ));
            }

            // 7. Filtre Type
            if (request.getType() != null && !request.getType().trim().isEmpty()) {
                try {
                    PublicationType pt = PublicationType.valueOf(request.getType().trim().toUpperCase());
                    predicates.add(cb.equal(root.get("type"), pt));
                } catch (IllegalArgumentException ignored) {}
            }

            // 8. Filtre Langue
            if (request.getLanguage() != null && !request.getLanguage().trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("language")), request.getLanguage().trim().toLowerCase()));
            }

            // 9. Filtre Année académique
            if (request.getAcademicYear() != null && !request.getAcademicYear().trim().isEmpty()) {
                predicates.add(cb.like(root.get("academicYear"), "%" + request.getAcademicYear().trim() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Publication> pageResult = publicationRepository.findAll(spec, pageable);
        List<PublicationDTO> dtos = pageResult.getContent().stream().map(this::toDTO).toList();
        long totalHits = pageResult.getTotalElements();

        if (currentUser != null && queryText != null && !queryText.isEmpty()) {
            recordSearchHistory(currentUser.getId(), queryText, request, (int) Math.min(totalHits, Integer.MAX_VALUE));
        }

        return SearchResult.builder()
                .publications(dtos)
                .totalHits(totalHits)
                .page(page)
                .totalPages(pageResult.getTotalPages())
                .searchType("TEXTUAL")
                .fallbackUsed(false)
                .build();
    }

    @Override
    @Transactional
    public SearchResult semanticSearch(String query, int limit) {
        return semanticSearch(query, limit, null);
    }

    @Override
    @Transactional
    public SearchResult semanticSearch(String query, int limit, CustomUserDetails currentUser) {
        if (query == null || query.trim().isEmpty()) {
            return SearchResult.builder()
                    .publications(Collections.emptyList())
                    .totalHits(0)
                    .page(0)
                    .totalPages(0)
                    .searchType("SEMANTIC")
                    .fallbackUsed(false)
                    .build();
        }

        int fetchLimit = limit > 0 ? Math.min(limit, 30) : 10;

        float[] queryEmbedding;
        try {
            // 1. Vectorisation de la requête avec Qwen text-embedding-v4 (dimension 1024)
            queryEmbedding = embeddingProvider.generateEmbedding(query.trim());
        } catch (Exception e) {
            log.warn("Fournisseur d'embeddings Qwen non disponible pour la recherche sémantique : {}. Bascule explicite sur la recherche multi-critères.", e.getMessage());
            SearchResult fallback = search(SearchRequest.builder().query(query).page(0).size(fetchLimit).build(), currentUser);
            fallback.setSearchType("TEXTUAL_FALLBACK");
            fallback.setFallbackUsed(true);
            return fallback;
        }

        if (queryEmbedding == null || queryEmbedding.length != embeddingProvider.getDimension()) {
            log.warn("Embedding invalide généré pour la requête. Bascule explicite sur la recherche multi-critères.");
            SearchResult fallback = search(SearchRequest.builder().query(query).page(0).size(fetchLimit).build(), currentUser);
            fallback.setSearchType("TEXTUAL_FALLBACK");
            fallback.setFallbackUsed(true);
            return fallback;
        }

        List<PublicationDTO> results = new ArrayList<>();

        // 2. Véritable recherche par similarité vectorielle pgvector avec filtres d'accès SQL stricts
        try {
            String vectorStr = Arrays.toString(queryEmbedding);

            // Filtrage d'accès appliqué directement dans la sélection SQL pour ne pas saturer le LIMIT avec des documents inaccessibles
            String accessClause;
            if (!isAuthenticatedMember(currentUser)) {
                accessClause = "AND p.access_level = 'PUBLIC'";
            } else if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF) {
                accessClause = "";
            } else {
                accessClause = "AND (p.access_level IN ('PUBLIC', 'INSTITUTIONAL') OR p.id IN (SELECT pa.publication_id FROM publication_authors pa WHERE pa.user_id = :userId))";
            }

            String nativeSql = """
                SELECT p.id, MIN(de.embedding <=> cast(:vectorStr as vector)) as dist
                FROM document_embeddings de
                JOIN document_chunks dc ON de.chunk_id = dc.id
                JOIN documents d ON dc.document_id = d.id
                JOIN publications p ON d.publication_id = p.id
                WHERE p.status = 'PUBLISHED'
                  AND de.embedding IS NOT NULL
            """ + " " + accessClause + """
                GROUP BY p.id
                ORDER BY dist ASC
                LIMIT :lim
            """;

            Query nativeQuery = entityManager.createNativeQuery(nativeSql);
            nativeQuery.setParameter("vectorStr", vectorStr);
            nativeQuery.setParameter("lim", fetchLimit);
            if (isAuthenticatedMember(currentUser)
                    && currentUser.getRole() != Role.ADMIN
                    && currentUser.getRole() != Role.STAFF) {
                nativeQuery.setParameter("userId", currentUser.getId());
            }

            @SuppressWarnings("unchecked")
            List<Object[]> rows = nativeQuery.getResultList();

            for (Object[] row : rows) {
                Long pubId = ((Number) row[0]).longValue();
                publicationRepository.findById(pubId).ifPresent(p -> results.add(toDTO(p)));
            }
        } catch (Exception e) {
            log.warn("Recherche vectorielle native pgvector non disponible, bascule explicite sur la recherche textuelle : {}", e.getMessage());
            SearchResult fallback = search(SearchRequest.builder().query(query).page(0).size(fetchLimit).build(), currentUser);
            fallback.setSearchType("TEXTUAL_FALLBACK");
            fallback.setFallbackUsed(true);
            return fallback;
        }

        return SearchResult.builder()
                .publications(results)
                .totalHits(results.size())
                .page(0)
                .totalPages(results.isEmpty() ? 0 : 1)
                .searchType("SEMANTIC")
                .fallbackUsed(false)
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

        // Titres correspondants via recherche indexée
        Page<Publication> matchingPubs = publicationRepository.searchByText(PublicationStatus.PUBLISHED, q, PageRequest.of(0, 5));
        for (Publication p : matchingPubs.getContent()) {
            if (p.getTitle() != null) {
                suggestions.add(p.getTitle());
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
        if (isAuthenticatedMember(user)) {
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
            return isAuthenticatedMember(user);
        }
        return false;
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
                .authors(authorRepository.findByPublicationIdOrderByPositionAsc(p.getId()).stream()
                        .map(PublicationAuthor::getAuthorName)
                        .filter(Objects::nonNull)
                        .toList())
                .hasDocument(!documentRepository.findByPublicationId(p.getId()).isEmpty())
                .viewCount(p.getViewCount())
                .downloadCount(p.getDownloadCount())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
