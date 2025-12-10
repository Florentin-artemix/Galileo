package com.galileo.ecriture.dto;

import jakarta.validation.constraints.*;
import java.util.List;

/**
 * DTO pour créer une nouvelle soumission
 */
public class SoumissionCreationDTO {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 10, max = 255, message = "Le titre doit contenir entre 10 et 255 caractères")
    private String titre;

    @NotBlank(message = "Le résumé est obligatoire")
    @Size(min = 50, max = 2000, message = "Le résumé doit contenir entre 50 et 2000 caractères")
    private String resume;

    @NotBlank(message = "L'auteur principal est obligatoire")
    @Size(max = 255, message = "Le nom de l'auteur ne peut pas dépasser 255 caractères")
    private String auteurPrincipal;

    @NotBlank(message = "L'email de l'auteur est obligatoire")
    @Email(message = "L'email doit être valide")
    private String emailAuteur;

    private List<String> coAuteurs;

    @NotEmpty(message = "Au moins un mot-clé est requis")
    @Size(min = 3, max = 10, message = "Entre 3 et 10 mots-clés sont requis")
    private List<String> motsCles;

    @NotBlank(message = "Le domaine de recherche est obligatoire")
    private String domaineRecherche;

    @Size(max = 1000, message = "Les notes ne peuvent pas dépasser 1000 caractères")
    private String notes;

    // Constructeurs
    public SoumissionCreationDTO() {}

    public SoumissionCreationDTO(String titre, String resume, String auteurPrincipal, String emailAuteur) {
        this.titre = titre;
        this.resume = resume;
        this.auteurPrincipal = auteurPrincipal;
        this.emailAuteur = emailAuteur;
    }

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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
