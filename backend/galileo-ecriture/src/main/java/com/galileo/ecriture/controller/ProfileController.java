package com.galileo.ecriture.controller;

import com.galileo.ecriture.service.CloudflareR2Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Contrôleur pour la gestion des profils utilisateurs
 * Permet l'upload des photos de profil vers Cloudflare R2
 */
@RestController
@RequestMapping("/profile")
public class ProfileController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max
    private static final String[] ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"};

    private final CloudflareR2Service cloudflareR2Service;

    @Autowired(required = false)
    public ProfileController(CloudflareR2Service cloudflareR2Service) {
        this.cloudflareR2Service = cloudflareR2Service;
    }

    /**
     * POST /profile/photo - Upload une photo de profil
     */
    @PostMapping("/photo")
    public ResponseEntity<?> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Email") String userEmail) {
        
        logger.info("Upload photo de profil pour user: {}", userId);

        // Vérifier si R2 est configuré
        if (cloudflareR2Service == null) {
            return ResponseEntity.status(503).body(Map.of(
                "error", "Service non disponible",
                "message", "Cloudflare R2 n'est pas configuré"
            ));
        }

        // Valider le fichier
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Fichier vide",
                "message", "Veuillez sélectionner une image"
            ));
        }

        // Vérifier la taille
        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Fichier trop volumineux",
                "message", "La taille maximale est de 5 MB"
            ));
        }

        // Vérifier le type
        String contentType = file.getContentType();
        boolean typeValide = false;
        for (String allowedType : ALLOWED_TYPES) {
            if (allowedType.equals(contentType)) {
                typeValide = true;
                break;
            }
        }
        if (!typeValide) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Type non supporté",
                "message", "Seuls les formats JPEG, PNG, GIF et WebP sont acceptés"
            ));
        }

        try {
            // Upload vers R2 avec préfixe profiles/
            String r2Key = cloudflareR2Service.uploadFile(file, "profiles/");
            
            // Générer une URL signée valide 7 jours (10080 minutes)
            String signedUrl = cloudflareR2Service.genererUrlSignee(r2Key, 10080);
            
            logger.info("Photo de profil uploadée: {} pour user {}", r2Key, userId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "r2Key", r2Key,
                "imageUrl", signedUrl,
                "message", "Photo de profil uploadée avec succès"
            ));

        } catch (IOException e) {
            logger.error("Erreur upload photo profil: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Erreur d'upload",
                "message", "Impossible d'uploader l'image: " + e.getMessage()
            ));
        }
    }

    /**
     * DELETE /profile/photo - Supprimer la photo de profil
     */
    @DeleteMapping("/photo")
    public ResponseEntity<?> deleteProfilePhoto(
            @RequestParam("key") String r2Key,
            @RequestHeader("X-User-Id") String userId) {
        
        logger.info("Suppression photo de profil: {} pour user {}", r2Key, userId);

        if (cloudflareR2Service == null) {
            return ResponseEntity.status(503).body(Map.of(
                "error", "Service non disponible",
                "message", "Cloudflare R2 n'est pas configuré"
            ));
        }

        // Vérifier que la clé commence par profiles/ (sécurité)
        if (!r2Key.startsWith("profiles/")) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Clé invalide",
                "message", "Cette clé ne correspond pas à une photo de profil"
            ));
        }

        try {
            cloudflareR2Service.supprimerFichier(r2Key);
            logger.info("Photo de profil supprimée: {}", r2Key);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Photo de profil supprimée"
            ));

        } catch (Exception e) {
            logger.error("Erreur suppression photo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Erreur de suppression",
                "message", e.getMessage()
            ));
        }
    }
}
