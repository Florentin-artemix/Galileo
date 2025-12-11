package com.galileo.lecture.service;

import com.galileo.lecture.document.BlogDocument;
import com.galileo.lecture.document.PublicationDocument;
import com.galileo.lecture.repository.search.BlogSearchRepository;
import com.galileo.lecture.repository.search.PublicationSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de recherche Elasticsearch avec fonctionnalités avancées
 */
@Service
public class SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchService.class);

    private final PublicationSearchRepository publicationSearchRepository;
    private final BlogSearchRepository blogSearchRepository;

    public SearchService(PublicationSearchRepository publicationSearchRepository,
                         BlogSearchRepository blogSearchRepository) {
        this.publicationSearchRepository = publicationSearchRepository;
        this.blogSearchRepository = blogSearchRepository;
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
