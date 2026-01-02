package com.galileo.ecriture.service;

import com.galileo.ecriture.entity.Soumission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service de logging des notifications (emails désactivés)
 * Note: L'envoi d'emails réels est désactivé. Toutes les notifications sont uniquement loggées.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    /**
     * Log une confirmation de soumission (email désactivé)
     */
    public void envoyerConfirmationSoumission(Soumission soumission) {
        logger.info("📧 [EMAIL DÉSACTIVÉ] Confirmation de soumission pour: {} ({}) - Soumission #{}: \"{}\"",
            soumission.getAuteurPrincipal(),
            soumission.getEmailAuteur(),
            soumission.getId(),
            soumission.getTitre());
    }

    /**
     * Log une notification admin pour nouvelle soumission (email désactivé)
     */
    public void notifierNouvelleSubmission(Soumission soumission) {
        logger.info("📧 [EMAIL DÉSACTIVÉ] Nouvelle soumission reçue - #{}: \"{}\" par {} ({}) - Domaine: {}",
            soumission.getId(),
            soumission.getTitre(),
            soumission.getAuteurPrincipal(),
            soumission.getEmailAuteur(),
            soumission.getDomaineRecherche());
    }

    /**
     * Log une notification de validation (email désactivé)
     */
    public void notifierValidation(Soumission soumission) {
        logger.info("📧 [EMAIL DÉSACTIVÉ] Validation de soumission #{} pour {} ({}) - Titre: \"{}\" - Commentaire: {}",
            soumission.getId(),
            soumission.getAuteurPrincipal(),
            soumission.getEmailAuteur(),
            soumission.getTitre(),
            soumission.getCommentaireAdmin() != null ? soumission.getCommentaireAdmin().substring(0, Math.min(50, soumission.getCommentaireAdmin().length())) : "Aucun");
    }

    /**
     * Log une notification de rejet (email désactivé)
     */
    public void notifierRejet(Soumission soumission) {
        logger.info("📧 [EMAIL DÉSACTIVÉ] Rejet de soumission #{} pour {} ({}) - Titre: \"{}\" - Commentaire: {}",
            soumission.getId(),
            soumission.getAuteurPrincipal(),
            soumission.getEmailAuteur(),
            soumission.getTitre(),
            soumission.getCommentaireAdmin() != null ? soumission.getCommentaireAdmin().substring(0, Math.min(50, soumission.getCommentaireAdmin().length())) : "Aucun");
    }

    /**
     * Log une notification de révision demandée (email désactivé)
     */
    public void notifierRevision(Soumission soumission) {
        logger.info("📧 [EMAIL DÉSACTIVÉ] Demande de révisions pour soumission #{} pour {} ({}) - Titre: \"{}\" - Commentaire: {}",
            soumission.getId(),
            soumission.getAuteurPrincipal(),
            soumission.getEmailAuteur(),
            soumission.getTitre(),
            soumission.getCommentaireAdmin() != null ? soumission.getCommentaireAdmin().substring(0, Math.min(50, soumission.getCommentaireAdmin().length())) : "Aucun");
    }
}
