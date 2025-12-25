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
 * Contrôleur pour l'upload d'images de blog vers Cloudflare R2
 */
@RestController
@RequestMapping("/blog")
public class BlogImageController {

    private static final Logger logger = LoggerFactory.getLogger(BlogImageController.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max pour les images blog
    private static final String[] ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"};

    @Autowired(required = false)
    private CloudflareR2Service cloudflareR2Service;

    /**
     * POST /blog/upload-image - Upload une image pour un article de blog
     */
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadBlogImage(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        logger.info("Upload image blog par user: {} (role: {})", userId, userRole);

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
                "message", "La taille maximale est de 10 MB"
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
            // Upload vers R2 avec préfixe blog/
            String r2Key = cloudflareR2Service.uploadFile(file, "blog/");
            
            // Générer une URL signée valide 7 jours (10080 minutes) - maximum autorisé par S3/R2
            String signedUrl = cloudflareR2Service.genererUrlSignee(r2Key, 10080);
            
            logger.info("Image blog uploadée: {} par user {}", r2Key, userId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "r2Key", r2Key,
                "imageUrl", signedUrl,
                "message", "Image uploadée avec succès"
            ));

        } catch (IOException e) {
            logger.error("Erreur upload image blog: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Erreur d'upload",
                "message", "Impossible d'uploader l'image: " + e.getMessage()
            ));
        }
    }
}

