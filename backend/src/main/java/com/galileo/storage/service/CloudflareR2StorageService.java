package com.galileo.storage.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;

@Slf4j
@Service("cloudflareR2StorageService")
public class CloudflareR2StorageService implements StorageService {

    @Value("${galileo.storage.r2.account-id:}")
    private String accountId;

    @Value("${galileo.storage.r2.access-key-id:}")
    private String accessKeyId;

    @Value("${galileo.storage.r2.secret-access-key:}")
    private String secretAccessKey;

    @Value("${galileo.storage.r2.bucket-name:galileo-documents}")
    private String bucketName;

    @Value("${galileo.storage.r2.public-url:}")
    private String publicUrl;

    private S3Client s3Client;
    private S3Presigner s3Presigner;
    private boolean configured = false;

    @PostConstruct
    public void init() {
        if (accountId != null && !accountId.trim().isEmpty() &&
            accessKeyId != null && !accessKeyId.trim().isEmpty() &&
            secretAccessKey != null && !secretAccessKey.trim().isEmpty()) {
            try {
                String endpoint = String.format("https://%s.r2.cloudflarestorage.com", accountId.trim());
                AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKeyId.trim(), secretAccessKey.trim());
                StaticCredentialsProvider credProvider = StaticCredentialsProvider.create(credentials);

                this.s3Client = S3Client.builder()
                        .endpointOverride(URI.create(endpoint))
                        .credentialsProvider(credProvider)
                        .region(Region.of("auto"))
                        .build();

                this.s3Presigner = S3Presigner.builder()
                        .endpointOverride(URI.create(endpoint))
                        .credentialsProvider(credProvider)
                        .region(Region.of("auto"))
                        .build();

                this.configured = true;
                log.info("Client Cloudflare R2 initialisé avec succès pour le bucket : {}", bucketName);
            } catch (Exception e) {
                log.error("Erreur lors de l'initialisation du client Cloudflare R2", e);
                this.configured = false;
            }
        } else {
            log.info("Identifiants Cloudflare R2 non fournis. Le mode de stockage bascule sur le système local.");
            this.configured = false;
        }
    }

    public boolean isConfigured() {
        return configured;
    }

    @Override
    public String uploadFile(String key, InputStream inputStream, long contentLength, String contentType) {
        if (!configured || s3Client == null) {
            throw new IllegalStateException("Le client Cloudflare R2 n'est pas configuré");
        }

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .contentLength(contentLength)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(inputStream, contentLength));
        log.debug("Fichier téléversé sur Cloudflare R2 : {}", key);
        return key;
    }

    @Override
    public InputStream downloadFile(String key) {
        if (!configured || s3Client == null) {
            throw new IllegalStateException("Le client Cloudflare R2 n'est pas configuré");
        }

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        return s3Client.getObject(request);
    }

    @Override
    public void deleteFile(String key) {
        if (!configured || s3Client == null) {
            return;
        }

        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(request);
        } catch (Exception e) {
            log.warn("Impossible de supprimer le fichier sur R2 : {}", key, e);
        }
    }

    @Override
    public String generatePresignedUrl(String key, int expirationMinutes) {
        if (publicUrl != null && !publicUrl.trim().isEmpty()) {
            return publicUrl.replaceAll("/$", "") + "/" + key;
        }

        if (!configured || s3Presigner == null) {
            return "/api/documents/download/" + key;
        }

        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(expirationMinutes))
                    .getObjectRequest(getRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("Erreur lors de la génération de l'URL signée R2", e);
            return "/api/documents/download/" + key;
        }
    }
}
