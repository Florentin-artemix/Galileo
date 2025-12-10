package com.galileo.ecriture.client;

import com.galileo.ecriture.entity.Soumission;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign Client pour communiquer avec le Service Lecture
 */
@FeignClient(name = "service-lecture", url = "${services.lecture.url}")
public interface PublicationFeignClient {

    /**
     * Crée une publication dans le Service Lecture à partir d'une soumission validée
     * @param request DTO contenant les informations de la soumission
     * @return L'ID de la publication créée
     */
    @PostMapping("/api/publications/depuis-soumission")
    Long creerPublicationDepuisSoumission(@RequestBody PublicationCreationRequest request);

    /**
     * DTO pour la création de publication
     */
    class PublicationCreationRequest {
        private String titre;
        private String resume;
        private String auteurPrincipal;
        private String emailAuteur;
        private java.util.List<String> coAuteurs;
        private java.util.List<String> motsCles;
        private String domaineRecherche;
        private String urlPdf;
        private String r2KeyPdf;
        private Long soumissionId;

        // Constructeur vide
        public PublicationCreationRequest() {}

        // Constructeur depuis Soumission
        public static PublicationCreationRequest fromSoumission(Soumission soumission) {
            PublicationCreationRequest request = new PublicationCreationRequest();
            request.setTitre(soumission.getTitre());
            request.setResume(soumission.getResume());
            request.setAuteurPrincipal(soumission.getAuteurPrincipal());
            request.setEmailAuteur(soumission.getEmailAuteur());
            request.setCoAuteurs(soumission.getCoAuteurs());
            request.setMotsCles(soumission.getMotsCles());
            request.setDomaineRecherche(soumission.getDomaineRecherche());
            request.setUrlPdf(soumission.getUrlPdf());
            request.setR2KeyPdf(soumission.getR2KeyPdf());
            request.setSoumissionId(soumission.getId());
            return request;
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

        public java.util.List<String> getCoAuteurs() {
            return coAuteurs;
        }

        public void setCoAuteurs(java.util.List<String> coAuteurs) {
            this.coAuteurs = coAuteurs;
        }

        public java.util.List<String> getMotsCles() {
            return motsCles;
        }

        public void setMotsCles(java.util.List<String> motsCles) {
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
}
