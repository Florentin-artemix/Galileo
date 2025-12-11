package com.galileo.lecture.service;

import com.galileo.lecture.document.BlogDocument;
import com.galileo.lecture.document.PublicationDocument;
import com.galileo.lecture.entity.ArticleBlog;
import com.galileo.lecture.entity.Publication;
import com.galileo.lecture.repository.ArticleBlogRepository;
import com.galileo.lecture.repository.PublicationRepository;
import com.galileo.lecture.repository.search.BlogSearchRepository;
import com.galileo.lecture.repository.search.PublicationSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service d'indexation pour synchroniser PostgreSQL → Elasticsearch
 */
@Service
public class IndexationService {

    private static final Logger logger = LoggerFactory.getLogger(IndexationService.class);

    private final PublicationRepository publicationRepository;
    private final ArticleBlogRepository articleBlogRepository;
    private final PublicationSearchRepository publicationSearchRepository;
    private final BlogSearchRepository blogSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    public IndexationService(PublicationRepository publicationRepository,
                             ArticleBlogRepository articleBlogRepository,
                             PublicationSearchRepository publicationSearchRepository,
                             BlogSearchRepository blogSearchRepository,
                             ElasticsearchOperations elasticsearchOperations) {
        this.publicationRepository = publicationRepository;
        this.articleBlogRepository = articleBlogRepository;
        this.publicationSearchRepository = publicationSearchRepository;
        this.blogSearchRepository = blogSearchRepository;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    /**
     * Indexe toutes les publications depuis PostgreSQL vers Elasticsearch
     */
    @Transactional(readOnly = true)
    public void indexAllPublications() {
        logger.info("Début de l'indexation de toutes les publications...");

        List<Publication> publications = publicationRepository.findAll();
        List<PublicationDocument> documents = publications.stream()
                .map(this::convertToDocument)
                .collect(Collectors.toList());

        publicationSearchRepository.saveAll(documents);

        logger.info("Indexation terminée: {} publications indexées", documents.size());
    }

    /**
     * Indexe tous les articles de blog depuis PostgreSQL vers Elasticsearch
     */
    @Transactional(readOnly = true)
    public void indexAllBlogArticles() {
        logger.info("Début de l'indexation de tous les articles de blog...");

        List<ArticleBlog> articles = articleBlogRepository.findAll();
        List<BlogDocument> documents = articles.stream()
                .map(this::convertToBlogDocument)
                .collect(Collectors.toList());

        blogSearchRepository.saveAll(documents);

        logger.info("Indexation terminée: {} articles de blog indexés", documents.size());
    }

    /**
     * Indexe une publication spécifique
     */
    @Transactional(readOnly = true)
    public void indexPublication(Long publicationId) {
        logger.info("Indexation de la publication ID: {}", publicationId);

        publicationRepository.findById(publicationId).ifPresent(publication -> {
            PublicationDocument document = convertToDocument(publication);
            publicationSearchRepository.save(document);
            logger.info("Publication {} indexée avec succès", publicationId);
        });
    }

    /**
     * Indexe un article de blog spécifique
     */
    @Transactional(readOnly = true)
    public void indexBlogArticle(Long articleId) {
        logger.info("Indexation de l'article de blog ID: {}", articleId);

        articleBlogRepository.findById(articleId).ifPresent(article -> {
            BlogDocument document = convertToBlogDocument(article);
            blogSearchRepository.save(document);
            logger.info("Article de blog {} indexé avec succès", articleId);
        });
    }

    /**
     * Supprime une publication de l'index Elasticsearch
     */
    public void removePublicationFromIndex(Long publicationId) {
        logger.info("Suppression de la publication {} de l'index", publicationId);
        publicationSearchRepository.deleteById(String.valueOf(publicationId));
    }

    /**
     * Supprime un article de blog de l'index Elasticsearch
     */
    public void removeBlogArticleFromIndex(Long articleId) {
        logger.info("Suppression de l'article de blog {} de l'index", articleId);
        blogSearchRepository.deleteById(String.valueOf(articleId));
    }

    /**
     * Réindexe toutes les données (supprime et recrée les index)
     */
    @Transactional(readOnly = true)
    public void reindexAll() {
        logger.info("Réindexation complète en cours...");

        // Supprime et recrée les index
        elasticsearchOperations.indexOps(PublicationDocument.class).delete();
        elasticsearchOperations.indexOps(PublicationDocument.class).create();
        elasticsearchOperations.indexOps(PublicationDocument.class).putMapping(
            elasticsearchOperations.indexOps(PublicationDocument.class).createMapping()
        );

        elasticsearchOperations.indexOps(BlogDocument.class).delete();
        elasticsearchOperations.indexOps(BlogDocument.class).create();
        elasticsearchOperations.indexOps(BlogDocument.class).putMapping(
            elasticsearchOperations.indexOps(BlogDocument.class).createMapping()
        );

        // Indexe toutes les données
        indexAllPublications();
        indexAllBlogArticles();

        logger.info("Réindexation complète terminée");
    }

    /**
     * Convertit une entité Publication en document Elasticsearch
     */
    private PublicationDocument convertToDocument(Publication publication) {
        PublicationDocument doc = new PublicationDocument();

        doc.setId(String.valueOf(publication.getId()));
        doc.setPublicationId(publication.getId());
        doc.setTitre(publication.getTitre());
        doc.setResume(publication.getResume());
        doc.setAuteurPrincipal(publication.getAuteurPrincipal());
        
        // Conversion String -> List<String> pour coAuteurs
        if (publication.getCoAuteurs() != null && !publication.getCoAuteurs().isEmpty()) {
            doc.setCoAuteurs(List.of(publication.getCoAuteurs().split(",\\s*")));
        }
        
        doc.setDomaine(publication.getDomaine());
        
        // Conversion String -> List<String> pour motsCles
        if (publication.getMotsCles() != null && !publication.getMotsCles().isEmpty()) {
            doc.setMotsCles(List.of(publication.getMotsCles().split(",\\s*")));
        }
        doc.setDatePublication(publication.getDatePublication());
        doc.setNombreVues(publication.getNombreVues());
        doc.setNombreTelechargements(publication.getNombreTelechargements());
        doc.setPubliee(publication.getPubliee());

        // Contenu complet pour recherche globale
        StringBuilder contenu = new StringBuilder();
        contenu.append(publication.getTitre()).append(" ");
        contenu.append(publication.getResume()).append(" ");
        if (publication.getMotsCles() != null) {
            contenu.append(publication.getMotsCles()).append(" ");
        }
        contenu.append(publication.getAuteurPrincipal()).append(" ");
        if (publication.getCoAuteurs() != null && !publication.getCoAuteurs().isEmpty()) {
            contenu.append(publication.getCoAuteurs());
        }
        doc.setContenuComplet(contenu.toString());

        return doc;
    }

    /**
     * Convertit une entité ArticleBlog en document Elasticsearch
     */
    private BlogDocument convertToBlogDocument(ArticleBlog article) {
        BlogDocument doc = new BlogDocument();

        doc.setId(String.valueOf(article.getId()));
        doc.setArticleId(article.getId());
        doc.setTitre(article.getTitre());
        doc.setContenu(article.getContenu());
        doc.setAuteur(article.getAuteur());
        
        // Conversion String -> List<String> pour categories
        if (article.getCategorie() != null && !article.getCategorie().isEmpty()) {
            doc.setCategories(List.of(article.getCategorie().split(",\\s*")));
        }
        
        doc.setDatePublication(article.getDatePublication());
        doc.setTempsLecture(article.getTempsLecture());
        doc.setNombreVues(article.getNombreVues());
        doc.setPublie(article.getPublie());

        // Contenu complet pour recherche globale
        StringBuilder contenu = new StringBuilder();
        contenu.append(article.getTitre()).append(" ");
        contenu.append(article.getContenu()).append(" ");
        if (article.getCategorie() != null) {
            contenu.append(article.getCategorie());
        }
        doc.setContenuComplet(contenu.toString());

        return doc;
    }
}
