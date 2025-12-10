package com.galileo.ecriture.dto;

import com.galileo.ecriture.entity.Soumission.StatutSoumission;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour représenter une soumission dans les réponses API
 */
public class SoumissionResponseDTO {

    private Long id;
    private String titre;
    private String resume;
    private String auteurPrincipal;
    private String emailAuteur;
    private List<String> coAuteurs;
    private List<String> motsCles;
    private String domaineRecherche;
    private StatutSoumission statut;
    private LocalDateTime dateSoumission;
    private String urlPdf;
    private String notes;
    private String commentaireAdmin;
    private String valideePar;
    private LocalDateTime dateValidation;
    private Long publicationId;

    // Constructeurs
    public SoumissionResponseDTO() {}

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getEmailAuteur() {
        return emailAuteur;
    }

    public void setEmailAuteur(String emailAuteur) {
        this.emailAuteur = emailAuteur;
    }

    public List<String> getCoAuteurs() {
        return coAuteurs;
    }

    public void setCoAuteurs(List<String> coAuteurs) {
        this.coAuteurs = coAuteurs;
    }

    public List<String> getMotsCles() {
        return motsCles;
    }

    public void setMotsCles(List<String> motsCles) {
        this.motsCles = motsCles;
    }

    public String getDomaineRecherche() {
        return domaineRecherche;
    }

    public void setDomaineRecherche(String domaineRecherche) {
        this.domaineRecherche = domaineRecherche;
    }

    public StatutSoumission getStatut() {
        return statut;
    }

    public void setStatut(StatutSoumission statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateSoumission() {
        return dateSoumission;
    }

    public void setDateSoumission(LocalDateTime dateSoumission) {
        this.dateSoumission = dateSoumission;
    }

    public String getUrlPdf() {
        return urlPdf;
    }

    public void setUrlPdf(String urlPdf) {
        this.urlPdf = urlPdf;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCommentaireAdmin() {
        return commentaireAdmin;
    }

    public void setCommentaireAdmin(String commentaireAdmin) {
        this.commentaireAdmin = commentaireAdmin;
    }

    public String getValideePar() {
        return valideePar;
    }

    public void setValideePar(String valideePar) {
        this.valideePar = valideePar;
    }

    public LocalDateTime getDateValidation() {
        return dateValidation;
    }

    public void setDateValidation(LocalDateTime dateValidation) {
        this.dateValidation = dateValidation;
    }

    public Long getPublicationId() {
        return publicationId;
    }

    public void setPublicationId(Long publicationId) {
        this.publicationId = publicationId;
    }
}
