package com.galileo.lecture.repository.search;

import com.galileo.lecture.document.BlogDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository Elasticsearch pour la recherche d'articles de blog
 */
@Repository
public interface BlogSearchRepository extends ElasticsearchRepository<BlogDocument, String> {

    /**
     * Recherche full-text dans titre et contenu
     */
    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"titre^3\", \"contenu\"], \"type\": \"best_fields\", \"operator\": \"or\"}}")
    Page<BlogDocument> fullTextSearch(String searchTerm, Pageable pageable);

    /**
     * Recherche par catégories
     */
    Page<BlogDocument> findByCategoriesContaining(String categorie, Pageable pageable);

    /**
     * Recherche par auteur
     */
    Page<BlogDocument> findByAuteur(String auteur, Pageable pageable);

    /**
     * Suggestions pour autocomplete
     */
    @Query("{\"match_phrase_prefix\": {\"titre\": {\"query\": \"?0\", \"max_expansions\": 10}}}")
    List<BlogDocument> findSuggestions(String prefix);

    /**
     * Recherche d'articles publiés uniquement
     */
    Page<BlogDocument> findByPublieTrue(Pageable pageable);

    /**
     * Recherche avec filtre catégorie et auteur
     */
    @Query("{\"bool\": {\"must\": [{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"titre\", \"contenu\"]}}], \"filter\": [{\"term\": {\"categories\": \"?1\"}}, {\"term\": {\"auteur\": \"?2\"}}]}}")
    Page<BlogDocument> searchByTextCategoryAndAuthor(String searchTerm, String categorie, String auteur, Pageable pageable);
}
