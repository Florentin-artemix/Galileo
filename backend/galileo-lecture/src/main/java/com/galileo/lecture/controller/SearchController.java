package com.galileo.lecture.controller;

import com.galileo.lecture.document.BlogDocument;
import com.galileo.lecture.document.PublicationDocument;
import com.galileo.lecture.service.IndexationService;
import com.galileo.lecture.service.SearchService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la recherche Elasticsearch
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;
    private final IndexationService indexationService;

    public SearchController(SearchService searchService, IndexationService indexationService) {
        this.searchService = searchService;
        this.indexationService = indexationService;
    }

    /**
     * Recherche full-text dans les publications
     * GET /api/search/publications?q=machine+learning&page=0&size=10
     */
    @GetMapping("/publications")
    public ResponseEntity<Page<PublicationDocument>> searchPublications(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        if (q.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<PublicationDocument> results = searchService.searchPublications(q, pageable);

        return ResponseEntity.ok(results);
    }

    /**
     * Recherche full-text dans les articles de blog
     * GET /api/search/blog?q=intelligence+artificielle&page=0&size=10
     */
    @GetMapping("/blog")
    public ResponseEntity<Page<BlogDocument>> searchBlog(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        if (q.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<BlogDocument> results = searchService.searchBlog(q, pageable);

        return ResponseEntity.ok(results);
    }

    /**
     * Recherche de publications par domaine
     * GET /api/search/publications/domain/IA?page=0&size=10
     */
    @GetMapping("/publications/domain/{domaine}")
    public ResponseEntity<Page<PublicationDocument>> searchByDomain(
            @PathVariable String domaine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<PublicationDocument> results = searchService.searchPublicationsByDomain(domaine, pageable);

        return ResponseEntity.ok(results);
    }

    /**
     * Recherche de publications par auteur
     * GET /api/search/publications/author/Dr.+Martin?page=0&size=10
     */
    @GetMapping("/publications/author/{auteur}")
    public ResponseEntity<Page<PublicationDocument>> searchByAuthor(
            @PathVariable String auteur,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<PublicationDocument> results = searchService.searchPublicationsByAuthor(auteur, pageable);

        return ResponseEntity.ok(results);
    }

    /**
     * Recherche d'articles de blog par catégorie
     * GET /api/search/blog/category/Innovation?page=0&size=10
     */
    @GetMapping("/blog/category/{categorie}")
    public ResponseEntity<Page<BlogDocument>> searchBlogByCategory(
            @PathVariable String categorie,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BlogDocument> results = searchService.searchBlogByCategory(categorie, pageable);

        return ResponseEntity.ok(results);
    }

    /**
     * Autocomplete pour les publications
     * GET /api/search/publications/suggest?prefix=machi
     */
    @GetMapping("/publications/suggest")
    public ResponseEntity<List<String>> suggestPublications(@RequestParam String prefix) {
        if (prefix.length() < 2) {
            return ResponseEntity.badRequest().build();
        }

        List<String> suggestions = searchService.autocompletPublications(prefix);
        return ResponseEntity.ok(suggestions);
    }

    /**
     * Autocomplete pour les articles de blog
     * GET /api/search/blog/suggest?prefix=intel
     */
    @GetMapping("/blog/suggest")
    public ResponseEntity<List<String>> suggestBlog(@RequestParam String prefix) {
        if (prefix.length() < 2) {
            return ResponseEntity.badRequest().build();
        }

        List<String> suggestions = searchService.autocompletBlog(prefix);
        return ResponseEntity.ok(suggestions);
    }

    /**
     * Publications similaires
     * GET /api/search/publications/{id}/similar?limit=5
     */
    @GetMapping("/publications/{id}/similar")
    public ResponseEntity<List<PublicationDocument>> getSimilarPublications(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit) {

        List<PublicationDocument> similar = searchService.findSimilarPublications(id, limit);
        return ResponseEntity.ok(similar);
    }

    /**
     * Réindexation complète (ADMIN uniquement)
     * POST /api/search/reindex
     */
    @PostMapping("/reindex")
    public ResponseEntity<Map<String, String>> reindexAll() {
        indexationService.reindexAll();

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Réindexation complète terminée avec succès");

        return ResponseEntity.ok(response);
    }

    /**
     * Indexation d'une publication spécifique (ADMIN uniquement)
     * POST /api/search/index/publication/{id}
     */
    @PostMapping("/index/publication/{id}")
    public ResponseEntity<Map<String, String>> indexPublication(@PathVariable Long id) {
        indexationService.indexPublication(id);

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Publication " + id + " indexée avec succès");

        return ResponseEntity.ok(response);
    }

    /**
     * Indexation d'un article de blog spécifique (ADMIN uniquement)
     * POST /api/search/index/blog/{id}
     */
    @PostMapping("/index/blog/{id}")
    public ResponseEntity<Map<String, String>> indexBlogArticle(@PathVariable Long id) {
        indexationService.indexBlogArticle(id);

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Article de blog " + id + " indexé avec succès");

        return ResponseEntity.ok(response);
    }
}
