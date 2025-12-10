package com.galileo.lecture.service;

import com.galileo.lecture.document.BlogDocument;
import com.galileo.lecture.document.PublicationDocument;
import com.galileo.lecture.repository.search.BlogSearchRepository;
import com.galileo.lecture.repository.search.PublicationSearchRepository;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.query.NativeSearchQueryBuilder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service de recherche Elasticsearch avec fonctionnalités avancées
 */
@Service
public class SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchService.class);

    private final PublicationSearchRepository publicationSearchRepository;
    private final BlogSearchRepository blogSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    public SearchService(PublicationSearchRepository publicationSearchRepository,
                         BlogSearchRepository blogSearchRepository,
                         ElasticsearchOperations elasticsearchOperations) {
        this.publicationSearchRepository = publicationSearchRepository;
        this.blogSearchRepository = blogSearchRepository;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    /**
     * Recherche full-text dans les publications
     */
    public Page<PublicationDocument> searchPublications(String searchTerm, Pageable pageable) {
        logger.info("Recherche de publications: '{}'", searchTerm);
        return publicationSearchRepository.fullTextSearch(searchTerm, pageable);
    }

    /**
     * Recherche full-text dans les articles de blog
     */
    public Page<BlogDocument> searchBlog(String searchTerm, Pageable pageable) {
        logger.info("Recherche d'articles de blog: '{}'", searchTerm);
        return blogSearchRepository.fullTextSearch(searchTerm, pageable);
    }

    /**
     * Recherche de publications par domaine
     */
    public Page<PublicationDocument> searchPublicationsByDomain(String domaine, Pageable pageable) {
        logger.info("Recherche de publications par domaine: {}", domaine);
        return publicationSearchRepository.findByDomaine(domaine, pageable);
    }

    /**
     * Recherche de publications par auteur
     */
    public Page<PublicationDocument> searchPublicationsByAuthor(String auteur, Pageable pageable) {
        logger.info("Recherche de publications par auteur: {}", auteur);
        return publicationSearchRepository.findByAuthor(auteur, pageable);
    }

    /**
     * Recherche d'articles de blog par catégorie
     */
    public Page<BlogDocument> searchBlogByCategory(String categorie, Pageable pageable) {
        logger.info("Recherche d'articles de blog par catégorie: {}", categorie);
        return blogSearchRepository.findByCategoriesContaining(categorie, pageable);
    }

    /**
     * Autocomplete pour les publications (suggestions de titres)
     */
    public List<String> autocompletPublications(String prefix) {
        logger.info("Autocomplete publications: '{}'", prefix);
        return publicationSearchRepository.findSuggestions(prefix)
                .stream()
                .map(PublicationDocument::getTitre)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * Autocomplete pour les articles de blog
     */
    public List<String> autocompletBlog(String prefix) {
        logger.info("Autocomplete blog: '{}'", prefix);
        return blogSearchRepository.findSuggestions(prefix)
                .stream()
                .map(BlogDocument::getTitre)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * Recherche avancée de publications avec filtres
     */
    public Page<PublicationDocument> advancedSearchPublications(
            String searchTerm, String domaine, String auteur, Pageable pageable) {

        logger.info("Recherche avancée: term='{}', domaine='{}', auteur='{}'", searchTerm, domaine, auteur);

        Criteria criteria = new Criteria();

        if (searchTerm != null && !searchTerm.isEmpty()) {
            criteria = criteria.and(
                new Criteria("titre").matches(searchTerm)
                    .or("resume").matches(searchTerm)
                    .or("contenuComplet").matches(searchTerm)
            );
        }

        if (domaine != null && !domaine.isEmpty()) {
            criteria = criteria.and(new Criteria("domaine").is(domaine));
        }

        if (auteur != null && !auteur.isEmpty()) {
            criteria = criteria.and(
                new Criteria("auteurPrincipal").is(auteur)
                    .or("coAuteurs").contains(auteur)
            );
        }

        CriteriaQuery query = new CriteriaQuery(criteria, pageable);
        SearchHits<PublicationDocument> hits = elasticsearchOperations.search(query, PublicationDocument.class);

        List<PublicationDocument> documents = hits.stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(documents, pageable, hits.getTotalHits());
    }

    /**
     * Agrégations: Statistiques par domaine
     */
    public Map<String, Long> getPublicationCountByDomain() {
        logger.info("Récupération des statistiques par domaine");

        NativeSearchQueryBuilder queryBuilder = new NativeSearchQueryBuilder()
                .withAggregations(
                    AggregationBuilders.terms("by_domain")
                        .field("domaine")
                        .size(50)
                );

        SearchHits<PublicationDocument> hits = elasticsearchOperations.search(
            queryBuilder.build(),
            PublicationDocument.class
        );

        Map<String, Long> stats = new HashMap<>();

        if (hits.hasAggregations()) {
            Terms terms = (Terms) hits.getAggregations().asMap().get("by_domain");
            if (terms != null) {
                terms.getBuckets().forEach(bucket -> {
                    stats.put(bucket.getKeyAsString(), bucket.getDocCount());
                });
            }
        }

        return stats;
    }

    /**
     * Agrégations: Top auteurs
     */
    public Map<String, Long> getTopAuthors(int limit) {
        logger.info("Récupération du top {} auteurs", limit);

        NativeSearchQueryBuilder queryBuilder = new NativeSearchQueryBuilder()
                .withAggregations(
                    AggregationBuilders.terms("top_authors")
                        .field("auteurPrincipal")
                        .size(limit)
                );

        SearchHits<PublicationDocument> hits = elasticsearchOperations.search(
            queryBuilder.build(),
            PublicationDocument.class
        );

        Map<String, Long> topAuthors = new HashMap<>();

        if (hits.hasAggregations()) {
            Terms terms = (Terms) hits.getAggregations().asMap().get("top_authors");
            if (terms != null) {
                terms.getBuckets().forEach(bucket -> {
                    topAuthors.put(bucket.getKeyAsString(), bucket.getDocCount());
                });
            }
        }

        return topAuthors;
    }

    /**
     * Agrégations: Statistiques des catégories de blog
     */
    public Map<String, Long> getBlogCategoryStats() {
        logger.info("Récupération des statistiques par catégorie de blog");

        NativeSearchQueryBuilder queryBuilder = new NativeSearchQueryBuilder()
                .withAggregations(
                    AggregationBuilders.terms("by_category")
                        .field("categories")
                        .size(50)
                );

        SearchHits<BlogDocument> hits = elasticsearchOperations.search(
            queryBuilder.build(),
            BlogDocument.class
        );

        Map<String, Long> stats = new HashMap<>();

        if (hits.hasAggregations()) {
            Terms terms = (Terms) hits.getAggregations().asMap().get("by_category");
            if (terms != null) {
                terms.getBuckets().forEach(bucket -> {
                    stats.put(bucket.getKeyAsString(), bucket.getDocCount());
                });
            }
        }

        return stats;
    }

    /**
     * Recherche de publications similaires basée sur les mots-clés
     */
    public List<PublicationDocument> findSimilarPublications(Long publicationId, int limit) {
        logger.info("Recherche de publications similaires à: {}", publicationId);

        // Récupère la publication source
        PublicationDocument source = publicationSearchRepository.findById(String.valueOf(publicationId))
                .orElse(null);

        if (source == null || source.getMotsCles() == null || source.getMotsCles().isEmpty()) {
            return List.of();
        }

        // Recherche par mots-clés communs
        String searchTerm = String.join(" ", source.getMotsCles());
        Page<PublicationDocument> results = publicationSearchRepository.fullTextSearch(
            searchTerm,
            Pageable.ofSize(limit + 1) // +1 car le document source peut être inclus
        );

        return results.stream()
                .filter(doc -> !doc.getId().equals(String.valueOf(publicationId)))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
