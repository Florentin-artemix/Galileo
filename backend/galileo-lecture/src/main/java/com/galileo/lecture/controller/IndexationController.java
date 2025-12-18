package com.galileo.lecture.controller;

import com.galileo.lecture.service.IndexationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour l'indexation Elasticsearch
 * Endpoints protégés pour les opérations d'indexation
 */
@RestController
@RequestMapping("/indexation")
public class IndexationController {

    private static final Logger logger = LoggerFactory.getLogger(IndexationController.class);

    private final IndexationService indexationService;

    public IndexationController(IndexationService indexationService) {
        this.indexationService = indexationService;
    }

    /**
     * Indexe toutes les publications
     * POST /api/indexation/publications
     */
    @PostMapping("/publications")
    public ResponseEntity<String> indexAllPublications() {
        logger.info("Indexation de toutes les publications demandée");
        
        try {
            indexationService.indexAllPublications();
            return ResponseEntity.ok("Toutes les publications ont été indexées avec succès");
        } catch (Exception e) {
            logger.error("Erreur lors de l'indexation des publications", e);
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de l'indexation: " + e.getMessage());
        }
    }

    /**
     * Indexe tous les articles de blog
     * POST /api/indexation/blog
     */
    @PostMapping("/blog")
    public ResponseEntity<String> indexAllBlogArticles() {
        logger.info("Indexation de tous les articles de blog demandée");
        
        try {
            indexationService.indexAllBlogArticles();
            return ResponseEntity.ok("Tous les articles de blog ont été indexés avec succès");
        } catch (Exception e) {
            logger.error("Erreur lors de l'indexation des articles de blog", e);
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de l'indexation: " + e.getMessage());
        }
    }

    /**
     * Indexe une publication spécifique
     * POST /api/indexation/publications/{id}
     */
    @PostMapping("/publications/{id}")
    public ResponseEntity<String> indexPublication(@PathVariable Long id) {
        logger.info("Indexation de la publication {} demandée", id);
        
        try {
            indexationService.indexPublication(id);
            return ResponseEntity.ok("Publication " + id + " indexée avec succès");
        } catch (Exception e) {
            logger.error("Erreur lors de l'indexation de la publication {}", id, e);
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de l'indexation: " + e.getMessage());
        }
    }

    /**
     * Indexe un article de blog spécifique
     * POST /api/indexation/blog/{id}
     */
    @PostMapping("/blog/{id}")
    public ResponseEntity<String> indexBlogArticle(@PathVariable Long id) {
        logger.info("Indexation de l'article de blog {} demandée", id);
        
        try {
            indexationService.indexBlogArticle(id);
            return ResponseEntity.ok("Article de blog " + id + " indexé avec succès");
        } catch (Exception e) {
            logger.error("Erreur lors de l'indexation de l'article de blog {}", id, e);
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de l'indexation: " + e.getMessage());
        }
    }

    /**
     * Réindexe toutes les données
     * POST /api/indexation/reindex
     */
    @PostMapping("/reindex")
    public ResponseEntity<String> reindexAll() {
        logger.info("Réindexation complète demandée");
        
        try {
            indexationService.reindexAll();
            return ResponseEntity.ok("Réindexation complète effectuée avec succès");
        } catch (Exception e) {
            logger.error("Erreur lors de la réindexation", e);
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de la réindexation: " + e.getMessage());
        }
    }

    /**
     * Supprime une publication de l'index
     * DELETE /api/indexation/publications/{id}
     */
    @DeleteMapping("/publications/{id}")
    public ResponseEntity<String> removePublication(@PathVariable Long id) {
        logger.info("Suppression de la publication {} de l'index demandée", id);
        
        try {
            indexationService.removePublicationFromIndex(id);
            return ResponseEntity.ok("Publication " + id + " supprimée de l'index");
        } catch (Exception e) {
            logger.error("Erreur lors de la suppression de la publication {}", id, e);
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de la suppression: " + e.getMessage());
        }
    }

    /**
     * Supprime un article de blog de l'index
     * DELETE /api/indexation/blog/{id}
     */
    @DeleteMapping("/blog/{id}")
    public ResponseEntity<String> removeBlogArticle(@PathVariable Long id) {
        logger.info("Suppression de l'article de blog {} de l'index demandée", id);
        
        try {
            indexationService.removeBlogArticleFromIndex(id);
            return ResponseEntity.ok("Article de blog " + id + " supprimé de l'index");
        } catch (Exception e) {
            logger.error("Erreur lors de la suppression de l'article de blog {}", id, e);
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de la suppression: " + e.getMessage());
        }
    }
}
