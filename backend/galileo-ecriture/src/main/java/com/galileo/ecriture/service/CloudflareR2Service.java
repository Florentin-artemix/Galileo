package com.galileo.ecriture.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

/**
 * Service pour la gestion des fichiers sur Cloudflare R2
 * Ce bean est créé par CloudflareR2Config quand R2 est activé
 */
public class CloudflareR2Service {

    private static final Logger logger = LoggerFactory.getLogger(CloudflareR2Service.class);

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;

    public CloudflareR2Service(S3Client s3Client, S3Presigner s3Presigner, String bucketName) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
        logger.info("CloudflareR2Service créé avec bucket: {}", bucketName);
    }

    /**
     * Upload un fichier vers Cloudflare R2
     * @param file Le fichier à uploader
     * @param prefix Préfixe du chemin (ex: "soumissions/pdf/")
     * @return La clé R2 du fichier uploadé
     */
    public String uploadFile(MultipartFile file, String prefix) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier ne peut pas être vide");
        }

        // Générer une clé unique
        String fileName = file.getOriginalFilename();
        String fileExtension = fileName != null && fileName.contains(".") 
            ? fileName.substring(fileName.lastIndexOf(".")) 
            : "";
        String key = prefix + UUID.randomUUID().toString() + fileExtension;

        try {
            // Préparer la requête d'upload
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            // Upload le fichier
            s3Client.putObject(putObjectRequest, 
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            logger.info("Fichier uploadé avec succès: {}", key);
            return key;

        } catch (S3Exception e) {
            logger.error("Erreur lors de l'upload vers R2: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'upload du fichier: " + e.getMessage(), e);
        }
    }

    /**
     * Génère une URL signée temporaire pour accéder à un fichier
     * @param key La clé R2 du fichier
     * @param dureeValidite Durée de validité de l'URL en minutes
     * @return L'URL signée
     */
    public String genererUrlSignee(String key, int dureeValidite) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(dureeValidite))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String url = presignedRequest.url().toString();

            logger.debug("URL signée générée pour {}: {}", key, url);
            return url;

        } catch (S3Exception e) {
            logger.error("Erreur lors de la génération de l'URL signée: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération de l'URL signée: " + e.getMessage(), e);
        }
    }

    /**
     * Supprime un fichier de R2
     * @param key La clé R2 du fichier à supprimer
     */
    public void supprimerFichier(String key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            logger.info("Fichier supprimé: {}", key);

        } catch (S3Exception e) {
            logger.error("Erreur lors de la suppression du fichier {}: {}", key, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la suppression du fichier: " + e.getMessage(), e);
        }
    }

    /**
     * Vérifie si un fichier existe dans R2
     * @param key La clé R2 du fichier
     * @return true si le fichier existe, false sinon
     */
    public boolean fichierExiste(String key) {
        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;

        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            logger.error("Erreur lors de la vérification de l'existence du fichier {}: {}", key, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la vérification du fichier: " + e.getMessage(), e);
        }
    }
}
