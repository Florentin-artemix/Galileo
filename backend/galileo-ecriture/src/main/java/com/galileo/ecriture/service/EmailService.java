package com.galileo.ecriture.service;

import com.galileo.ecriture.entity.Soumission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service d'envoi d'emails via SendGrid
 * NOTE: L'intégration complète SendGrid sera ajoutée plus tard
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${sendgrid.from-email}")
    private String fromEmail;

    @Value("${sendgrid.admin-email}")
    private String adminEmail;

    /**
     * Envoie une confirmation de soumission à l'auteur
     */
    public void envoyerConfirmationSoumission(Soumission soumission) {
        logger.info("Envoi de confirmation de soumission à: {}", soumission.getEmailAuteur());
        
        // TODO: Implémenter l'envoi réel avec SendGrid
        String sujet = "Confirmation de soumission - " + soumission.getTitre();
        String contenu = String.format(
            "Bonjour %s,\n\n" +
            "Votre soumission \"%s\" a bien été reçue et est en cours de traitement.\n\n" +
            "Référence: #%d\n" +
            "Date de soumission: %s\n\n" +
            "Vous recevrez une notification dès que votre soumission sera examinée.\n\n" +
            "Cordialement,\n" +
            "L'équipe Galileo",
            soumission.getAuteurPrincipal(),
            soumission.getTitre(),
            soumission.getId(),
            soumission.getDateSoumission()
        );

        logger.debug("Email de confirmation préparé: {}", contenu);
        // Simulation d'envoi réussi
    }

    /**
     * Notifie l'admin d'une nouvelle soumission
     */
    public void notifierNouvelleSubmission(Soumission soumission) {
        logger.info("Notification admin pour nouvelle soumission: {}", soumission.getId());
        
        // TODO: Implémenter l'envoi réel avec SendGrid
        String sujet = "Nouvelle soumission à examiner - " + soumission.getTitre();
        String contenu = String.format(
            "Une nouvelle soumission a été reçue:\n\n" +
            "Titre: %s\n" +
            "Auteur: %s (%s)\n" +
            "Domaine: %s\n" +
            "Référence: #%d\n\n" +
            "Consultez le panneau d'administration pour examiner cette soumission.",
            soumission.getTitre(),
            soumission.getAuteurPrincipal(),
            soumission.getEmailAuteur(),
            soumission.getDomaineRecherche(),
            soumission.getId()
        );

        logger.debug("Email de notification admin préparé: {}", contenu);
        // Simulation d'envoi réussi
    }

    /**
     * Notifie l'auteur de la validation de sa soumission
     */
    public void notifierValidation(Soumission soumission) {
        logger.info("Notification de validation à: {}", soumission.getEmailAuteur());
        
        String sujet = "Votre soumission a été acceptée - " + soumission.getTitre();
        String contenu = String.format(
            "Bonjour %s,\n\n" +
            "Excellente nouvelle ! Votre soumission \"%s\" a été acceptée pour publication.\n\n" +
            "Commentaire de l'équipe éditoriale:\n%s\n\n" +
            "Votre article sera bientôt disponible sur notre plateforme.\n\n" +
            "Cordialement,\n" +
            "L'équipe Galileo",
            soumission.getAuteurPrincipal(),
            soumission.getTitre(),
            soumission.getCommentaireAdmin()
        );

        logger.debug("Email de validation préparé: {}", contenu);
        // Simulation d'envoi réussi
    }

    /**
     * Notifie l'auteur du rejet de sa soumission
     */
    public void notifierRejet(Soumission soumission) {
        logger.info("Notification de rejet à: {}", soumission.getEmailAuteur());
        
        String sujet = "Décision concernant votre soumission - " + soumission.getTitre();
        String contenu = String.format(
            "Bonjour %s,\n\n" +
            "Nous avons le regret de vous informer que votre soumission \"%s\" " +
            "n'a pas été retenue pour publication.\n\n" +
            "Commentaire de l'équipe éditoriale:\n%s\n\n" +
            "Nous vous encourageons à soumettre de nouveau après avoir pris en compte " +
            "ces remarques.\n\n" +
            "Cordialement,\n" +
            "L'équipe Galileo",
            soumission.getAuteurPrincipal(),
            soumission.getTitre(),
            soumission.getCommentaireAdmin()
        );

        logger.debug("Email de rejet préparé: {}", contenu);
        // Simulation d'envoi réussi
    }

    /**
     * Notifie l'auteur que sa soumission nécessite des révisions
     */
    public void notifierRevision(Soumission soumission) {
        logger.info("Notification de révision à: {}", soumission.getEmailAuteur());
        
        String sujet = "Révisions demandées pour votre soumission - " + soumission.getTitre();
        String contenu = String.format(
            "Bonjour %s,\n\n" +
            "Votre soumission \"%s\" a été examinée et nécessite quelques révisions.\n\n" +
            "Commentaires et suggestions:\n%s\n\n" +
            "Veuillez soumettre une version révisée en tenant compte de ces remarques.\n\n" +
            "Cordialement,\n" +
            "L'équipe Galileo",
            soumission.getAuteurPrincipal(),
            soumission.getTitre(),
            soumission.getCommentaireAdmin()
        );

        logger.debug("Email de révision préparé: {}", contenu);
        // Simulation d'envoi réussi
    }
}
