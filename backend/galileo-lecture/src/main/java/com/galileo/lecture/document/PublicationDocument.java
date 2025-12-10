package com.galileo.lecture.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Document Elasticsearch pour la recherche de publications
 * Index: publications
 */
@Document(indexName = "publications")
@Setting(settingPath = "elasticsearch/publication-settings.json")
public class PublicationDocument {

    @Id
    private String id; // ID Elasticsearch (différent de l'ID PostgreSQL)

    @Field(name = "publication_id", type = FieldType.Long)
    private Long publicationId; // ID PostgreSQL

    @Field(type = FieldType.Text, analyzer = "french")
    private String titre;

    @Field(type = FieldType.Text, analyzer = "french")
    private String resume;

    @Field(type = FieldType.Keyword)
    private String auteurPrincipal;

    @Field(type = FieldType.Text, analyzer = "french")
    private List<String> coAuteurs;

    @Field(type = FieldType.Keyword)
    private String domaine;

    @Field(type = FieldType.Keyword)
    private List<String> motsCles;

    @Field(type = FieldType.Date)
    private LocalDateTime datePublication;

    @Field(type = FieldType.Integer)
    private Integer nombreVues;

    @Field(type = FieldType.Integer)
    private Integer nombreTelechargements;

    @Field(type = FieldType.Boolean)
    private Boolean publiee;

    // Champ pour la recherche full-text globale
    @Field(type = FieldType.Text, analyzer = "french")
    private String contenuComplet; // Concaténation titre + résumé + auteurs + mots-clés

    // Constructeurs
    public PublicationDocument() {}

    // Getters et Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getPublicationId() {
        return publicationId;
    }

    public void setPublicationId(Long publicationId) {
        this.publicationId = publicationId;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getResume() {
        return resume;
    }

    public void setResume(String resume) {
        this.resume = resume;
    }

    public String getAuteurPrincipal() {
        return auteurPrincipal;
    }

    public void setAuteurPrincipal(String auteurPrincipal) {
        this.auteurPrincipal = auteurPrincipal;
    }

    public List<String> getCoAuteurs() {
        return coAuteurs;
    }

    public void setCoAuteurs(List<String> coAuteurs) {
        this.coAuteurs = coAuteurs;
    }

    public String getDomaine() {
        return domaine;
    }

    public void setDomaine(String domaine) {
        this.domaine = domaine;
    }

    public List<String> getMotsCles() {
        return motsCles;
    }

    public void setMotsCles(List<String> motsCles) {
        this.motsCles = motsCles;
    }

    public LocalDateTime getDatePublication() {
        return datePublication;
    }

    public void setDatePublication(LocalDateTime datePublication) {
        this.datePublication = datePublication;
    }

    public Integer getNombreVues() {
        return nombreVues;
    }

    public void setNombreVues(Integer nombreVues) {
        this.nombreVues = nombreVues;
    }

    public Integer getNombreTelechargements() {
        return nombreTelechargements;
    }

    public void setNombreTelechargements(Integer nombreTelechargements) {
        this.nombreTelechargements = nombreTelechargements;
    }

    public Boolean getPubliee() {
        return publiee;
    }

    public void setPubliee(Boolean publiee) {
        this.publiee = publiee;
    }

    public String getContenuComplet() {
        return contenuComplet;
    }

    public void setContenuComplet(String contenuComplet) {
        this.contenuComplet = contenuComplet;
    }
}
