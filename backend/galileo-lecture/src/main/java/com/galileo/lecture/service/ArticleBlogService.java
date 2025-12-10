package com.galileo.lecture.service;

import com.galileo.lecture.dto.ArticleBlogDTO;
import com.galileo.lecture.entity.ArticleBlog;
import com.galileo.lecture.repository.ArticleBlogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
