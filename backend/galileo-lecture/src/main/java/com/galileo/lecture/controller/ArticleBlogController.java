package com.galileo.lecture.controller;

import com.galileo.lecture.dto.ArticleBlogDTO;
import com.galileo.lecture.dto.ArticleBlogCreateDTO;
import com.galileo.lecture.service.ArticleBlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/blog")
@RequiredArgsConstructor
public class ArticleBlogController {

    private final ArticleBlogService articleBlogService;

    @GetMapping
    public ResponseEntity<List<ArticleBlogDTO>> listerArticles() {
        log.info("Récupération de tous les articles de blog");
        return ResponseEntity.ok(articleBlogService.obtenirTousLesArticles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleBlogDTO> obtenirArticle(@PathVariable Long id) {
        log.info("Récupération de l'article ID: {}", id);
        return ResponseEntity.ok(articleBlogService.obtenirArticleParId(id));
    }

    @GetMapping("/categorie/{categorie}")
    public ResponseEntity<List<ArticleBlogDTO>> obtenirArticlesParCategorie(@PathVariable String categorie) {
        log.info("Récupération des articles par catégorie: {}", categorie);
        return ResponseEntity.ok(articleBlogService.obtenirArticlesParCategorie(categorie));
    }

    @GetMapping("/recents")
    public ResponseEntity<List<ArticleBlogDTO>> obtenirArticlesRecents() {
        log.info("Récupération des articles récents");
        return ResponseEntity.ok(articleBlogService.obtenirArticlesRecents());
    }

    @GetMapping("/populaires")
    public ResponseEntity<List<ArticleBlogDTO>> obtenirArticlesPopulaires() {
        log.info("Récupération des articles populaires");
        return ResponseEntity.ok(articleBlogService.obtenirArticlesPopulaires());
    }

    /**
     * POST /blog - Créer un nouvel article de blog (ADMIN/STAFF uniquement)
     */
    @PostMapping
    public ResponseEntity<?> creerArticle(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody ArticleBlogCreateDTO dto) {
        
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Non authentifié",
                    "message", "Token Firebase requis"
            ));
        }
        
        if (userRole == null || (!userRole.equals("ADMIN") && !userRole.equals("STAFF"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Accès refusé",
                    "message", "Seuls les administrateurs et le staff peuvent créer des articles"
            ));
        }
        
        log.info("Création d'un nouvel article de blog par {} ({})", userId, userRole);
        try {
            ArticleBlogDTO created = articleBlogService.creerArticle(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Erreur création article blog: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur de création",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * PUT /blog/{id} - Mettre à jour un article de blog (ADMIN/STAFF uniquement)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> mettreAJourArticle(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody ArticleBlogCreateDTO dto) {
        
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Non authentifié",
                    "message", "Token Firebase requis"
            ));
        }
        
        if (userRole == null || (!userRole.equals("ADMIN") && !userRole.equals("STAFF"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Accès refusé",
                    "message", "Seuls les administrateurs et le staff peuvent modifier des articles"
            ));
        }
        
        log.info("Mise à jour de l'article de blog {} par {} ({})", id, userId, userRole);
        try {
            ArticleBlogDTO updated = articleBlogService.mettreAJourArticle(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Erreur mise à jour article blog {}: {}", id, e.getMessage());
            if (e.getMessage().contains("non trouvé")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur de mise à jour",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * DELETE /blog/{id} - Supprimer un article de blog (ADMIN uniquement)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerArticle(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Non authentifié",
                    "message", "Token Firebase requis"
            ));
        }
        
        if (userRole == null || !userRole.equals("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Accès refusé",
                    "message", "Seuls les administrateurs peuvent supprimer des articles"
            ));
        }
        
        log.info("Suppression de l'article de blog {} par {} ({})", id, userId, userRole);
        try {
            articleBlogService.supprimerArticle(id);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Article supprimé avec succès"
            ));
        } catch (RuntimeException e) {
            log.error("Erreur suppression article blog {}: {}", id, e.getMessage());
            if (e.getMessage().contains("non trouvé")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur de suppression",
                    "message", e.getMessage()
            ));
        }
    }
}
