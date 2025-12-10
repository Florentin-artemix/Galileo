package com.galileo.lecture.dto;

import java.util.List;

/**
 * DTO pour créer une publication depuis une soumission validée
 */
public class PublicationDepuisSoumissionDTO {

    private String titre;
    private String resume;
    private String auteurPrincipal;
    private String emailAuteur;
    private List<String> coAuteurs;
    private List<String> motsCles;
    private String domaineRecherche;
    private String urlPdf;
    private String r2KeyPdf;
    private Long soumissionId;

    // Constructeurs
    public PublicationDepuisSoumissionDTO() {}

    // Getters et Setters
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

    public String getUrlPdf() {
        return urlPdf;
    }

    public void setUrlPdf(String urlPdf) {
        this.urlPdf = urlPdf;
    }

    public String getR2KeyPdf() {
        return r2KeyPdf;
    }

    public void setR2KeyPdf(String r2KeyPdf) {
        this.r2KeyPdf = r2KeyPdf;
    }

    public Long getSoumissionId() {
        return soumissionId;
    }

    public void setSoumissionId(Long soumissionId) {
        this.soumissionId = soumissionId;
    }
}
