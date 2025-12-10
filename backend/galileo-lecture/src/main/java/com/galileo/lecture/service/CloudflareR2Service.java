package com.galileo.lecture.service;

import com.galileo.lecture.config.CloudflareR2Properties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;

/**
 * Service de gestion du stockage Cloudflare R2
 * Génère des URLs signées pour le téléchargement sécurisé des fichiers
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudflareR2Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final CloudflareR2Properties r2Properties;

    /**
     * Générer une URL signée temporaire pour télécharger un fichier
     * @param key La clé du fichier dans R2 (ex: "publications/2024/file.pdf")
     * @param dureeValidite Durée de validité en minutes
     * @return URL signée
     */
    public String genererUrlSignee(String key, int dureeValidite) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(r2Properties.getBucketName())
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(dureeValidite))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String url = presignedRequest.url().toString();
            
            log.info("URL signée générée pour: {} (validité: {} minutes)", key, dureeValidite);
            return url;
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération de l'URL signée: {}", e.getMessage());
            throw new RuntimeException("Impossible de générer l'URL signée", e);
        }
    }

    /**
     * Générer une URL publique (non signée) si le fichier est public
     * @param key La clé du fichier dans R2
     * @return URL publique
     */
    public String genererUrlPublique(String key) {
        return String.format("%s/%s", r2Properties.getPublicUrl(), key);
    }

    /**
     * Vérifier si un fichier existe dans R2
     * @param key La clé du fichier
     * @return true si le fichier existe
     */
    public boolean fichierExiste(String key) {
        try {
            s3Client.headObject(builder -> builder
                    .bucket(r2Properties.getBucketName())
                    .key(key)
                    .build());
            return true;
        } catch (Exception e) {
            log.debug("Fichier non trouvé: {}", key);
            return false;
        }
    }
}
