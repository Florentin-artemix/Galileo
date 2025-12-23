package com.galileo.lecture.service;

import com.galileo.lecture.dto.ArticleBlogDTO;
import com.galileo.lecture.dto.ArticleBlogCreateDTO;
import com.galileo.lecture.entity.ArticleBlog;
import com.galileo.lecture.repository.ArticleBlogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArticleBlogService {

    private final ArticleBlogRepository articleBlogRepository;
    private final IndexationService indexationService;

    public List<ArticleBlogDTO> obtenirTousLesArticles() {
        return articleBlogRepository.findByPublieTrue()
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ArticleBlogDTO obtenirArticleParId(Long id) {
        ArticleBlog article = articleBlogRepository.findById(id)
                .filter(ArticleBlog::getPublie)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));
        
        articleBlogRepository.incrementerVues(id);
        
        // Réindexer pour mettre à jour le compteur de vues
        indexationService.indexBlogArticle(id);
        
        return convertirEnDTO(article);
    }

    public List<ArticleBlogDTO> obtenirArticlesParCategorie(String categorie) {
        return articleBlogRepository.findByCategorieAndPublieTrue(categorie)
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    public List<ArticleBlogDTO> obtenirArticlesRecents() {
        return articleBlogRepository.findTop10ByPublieTrueOrderByDatePublicationDesc()
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    public List<ArticleBlogDTO> obtenirArticlesPopulaires() {
        return articleBlogRepository.findTop10ByPublieTrueOrderByNombreVuesDesc()
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Créer un nouvel article de blog
     */
    @Transactional
    public ArticleBlogDTO creerArticle(ArticleBlogCreateDTO dto) {
        log.info("Création d'un nouvel article de blog: {}", dto.getTitre());
        
        ArticleBlog article = ArticleBlog.builder()
                .titre(dto.getTitre())
                .contenu(dto.getContenu())
                .resume(dto.getResume())
                .auteur(dto.getAuteur())
                .categorie(dto.getCategorie())
                .motsCles(dto.getMotsCles())
                .urlImagePrincipale(dto.getUrlImagePrincipale())
                .tempsLecture(dto.getTempsLecture())
                .publie(dto.getPublie() != null ? dto.getPublie() : true)
                .nombreVues(0)
                .datePublication(LocalDateTime.now())
                .build();
        
        ArticleBlog saved = articleBlogRepository.save(article);
        log.info("Article de blog créé avec l'ID: {}", saved.getId());
        
        // Indexer automatiquement dans Elasticsearch
        indexationService.indexBlogArticle(saved.getId());
        
        return convertirEnDTO(saved);
    }

    /**
     * Mettre à jour un article de blog
     */
    @Transactional
    public ArticleBlogDTO mettreAJourArticle(Long id, ArticleBlogCreateDTO dto) {
        log.info("Mise à jour de l'article de blog ID: {}", id);
        
        ArticleBlog article = articleBlogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article de blog non trouvé"));
        
        article.setTitre(dto.getTitre());
        article.setContenu(dto.getContenu());
        article.setResume(dto.getResume());
        article.setAuteur(dto.getAuteur());
        article.setCategorie(dto.getCategorie());
        article.setMotsCles(dto.getMotsCles());
        article.setUrlImagePrincipale(dto.getUrlImagePrincipale());
        article.setTempsLecture(dto.getTempsLecture());
        if (dto.getPublie() != null) {
            article.setPublie(dto.getPublie());
        }
        
        ArticleBlog saved = articleBlogRepository.save(article);
        log.info("Article de blog {} mis à jour", id);
        
        // Réindexer dans Elasticsearch
        indexationService.indexBlogArticle(saved.getId());
        
        return convertirEnDTO(saved);
    }

    /**
     * Supprimer un article de blog
     */
    @Transactional
    public void supprimerArticle(Long id) {
        log.info("Suppression de l'article de blog ID: {}", id);
        
        ArticleBlog article = articleBlogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article de blog non trouvé"));
        
        articleBlogRepository.delete(article);
        
        // Supprimer de l'index Elasticsearch
        indexationService.removeBlogArticleFromIndex(id);
        
        log.info("Article de blog {} supprimé", id);
    }

    private ArticleBlogDTO convertirEnDTO(ArticleBlog article) {
        return ArticleBlogDTO.builder()
                .id(article.getId())
                .titre(article.getTitre())
                .contenu(article.getContenu())
                .resume(article.getResume())
                .auteur(article.getAuteur())
                .categorie(article.getCategorie())
                .motsCles(article.getMotsCles())
                .urlImagePrincipale(article.getUrlImagePrincipale())
                .tempsLecture(article.getTempsLecture())
                .nombreVues(article.getNombreVues())
                .datePublication(article.getDatePublication())
                .build();
    }
}
