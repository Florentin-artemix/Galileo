package com.galileo.lecture.repository.search;

import com.galileo.lecture.document.PublicationDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository Elasticsearch pour la recherche de publications
 */
@Repository
public interface PublicationSearchRepository extends ElasticsearchRepository<PublicationDocument, String> {

    /**
     * Recherche full-text dans titre, résumé et contenu
     */
    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"titre^3\", \"resume^2\", \"contenuComplet\"], \"type\": \"best_fields\", \"operator\": \"or\"}}")
    Page<PublicationDocument> fullTextSearch(String searchTerm, Pageable pageable);

    /**
     * Recherche par domaine (exact match)
     */
    Page<PublicationDocument> findByDomaine(String domaine, Pageable pageable);

    /**
     * Recherche par auteur principal
     */
    Page<PublicationDocument> findByAuteurPrincipal(String auteurPrincipal, Pageable pageable);

    /**
     * Recherche par mots-clés
     */
    Page<PublicationDocument> findByMotsClesContaining(String motCle, Pageable pageable);

    /**
     * Suggestions pour autocomplete (recherche dans titre)
     */
    @Query("{\"match_phrase_prefix\": {\"titre\": {\"query\": \"?0\", \"max_expansions\": 10}}}")
    List<PublicationDocument> findSuggestions(String prefix);

    /**
     * Recherche avancée avec filtres multiples
     */
    @Query("{\"bool\": {\"must\": [{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"titre\", \"resume\", \"contenuComplet\"]}}], \"filter\": [{\"term\": {\"domaine\": \"?1\"}}]}}")
    Page<PublicationDocument> searchByTextAndDomain(String searchTerm, String domaine, Pageable pageable);

    /**
     * Recherche de publications publiées uniquement
     */
    Page<PublicationDocument> findByPublieeTrue(Pageable pageable);

    /**
     * Recherche par auteur dans auteurPrincipal ou coAuteurs
     */
    @Query("{\"bool\": {\"should\": [{\"term\": {\"auteurPrincipal\": \"?0\"}}, {\"term\": {\"coAuteurs\": \"?0\"}}]}}")
    Page<PublicationDocument> findByAuthor(String auteur, Pageable pageable);
}
