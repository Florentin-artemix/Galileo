package com.galileo.lecture.controller;

import com.galileo.lecture.dto.ArticleBlogDTO;
import com.galileo.lecture.service.ArticleBlogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
