package com.galileo.lecture.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Document Elasticsearch pour la recherche d'articles de blog
 * Index: blog_articles
 */
@Document(indexName = "blog_articles")
public class BlogDocument {

    @Id
    private String id;

    @Field(name = "article_id", type = FieldType.Long)
    private Long articleId; // ID PostgreSQL

    @Field(type = FieldType.Text, analyzer = "french")
    private String titre;

    @Field(type = FieldType.Text, analyzer = "french")
    private String contenu;

    @Field(type = FieldType.Keyword)
    private String auteur;

    @Field(type = FieldType.Keyword)
    private List<String> categories;

    @Field(type = FieldType.Date)
    private LocalDateTime datePublication;

    @Field(type = FieldType.Integer)
    private Integer tempsLecture; // en minutes

    @Field(type = FieldType.Integer)
    private Integer nombreVues;

    @Field(type = FieldType.Boolean)
    private Boolean publie;

    // Champ pour recherche globale
    @Field(type = FieldType.Text, analyzer = "french")
    private String contenuComplet; // titre + contenu + catégories

    // Constructeurs
    public BlogDocument() {}

    // Getters et Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getArticleId() {
        return articleId;
    }

    public void setArticleId(Long articleId) {
        this.articleId = articleId;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getContenu() {
        return contenu;
    }

    public void setContenu(String contenu) {
        this.contenu = contenu;
    }

    public String getAuteur() {
        return auteur;
    }

    public void setAuteur(String auteur) {
        this.auteur = auteur;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories;
    }

    public LocalDateTime getDatePublication() {
        return datePublication;
    }

    public void setDatePublication(LocalDateTime datePublication) {
        this.datePublication = datePublication;
    }

    public Integer getTempsLecture() {
        return tempsLecture;
    }

    public void setTempsLecture(Integer tempsLecture) {
        this.tempsLecture = tempsLecture;
    }

    public Integer getNombreVues() {
        return nombreVues;
    }

    public void setNombreVues(Integer nombreVues) {
        this.nombreVues = nombreVues;
    }

    public Boolean getPublie() {
        return publie;
    }

    public void setPublie(Boolean publie) {
        this.publie = publie;
    }

    public String getContenuComplet() {
        return contenuComplet;
    }

    public void setContenuComplet(String contenuComplet) {
        this.contenuComplet = contenuComplet;
    }
}
