package com.galileo.ecriture.config;

import com.galileo.ecriture.service.CloudflareR2Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Slf4j
@Configuration
@ConditionalOnProperty(name = "cloudflare.r2.enabled", havingValue = "true", matchIfMissing = false)
public class CloudflareR2Config {

    @Value("${cloudflare.r2.endpoint}")
    private String endpoint;

    @Value("${cloudflare.r2.access-key}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key}")
    private String secretKey;

    @Value("${cloudflare.r2.region}")
    private String region;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    @Bean
    public S3Client s3Client() {
        log.info("🚀 Initialisation Cloudflare R2 S3Client - Endpoint: {}, Bucket: {}", endpoint, bucketName);
        
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        S3Client client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of(region))
                .build();
        
        log.info("✅ Cloudflare R2 S3Client initialisé avec succès");
        return client;
    }

    @Bean
    public S3Presigner s3Presigner() {
        log.info("🚀 Initialisation Cloudflare R2 S3Presigner");
        
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        S3Presigner presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of(region))
                .build();
        
        log.info("✅ Cloudflare R2 S3Presigner initialisé avec succès");
        return presigner;
    }

    @Bean
    public CloudflareR2Service cloudflareR2Service(S3Client s3Client, S3Presigner s3Presigner) {
        log.info("🚀 Création du bean CloudflareR2Service avec bucket: {}", bucketName);
        CloudflareR2Service service = new CloudflareR2Service(s3Client, s3Presigner, bucketName);
        log.info("✅ CloudflareR2Service initialisé avec succès");
        return service;
    }
}
