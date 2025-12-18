package com.galileo.lecture.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Configuration du client S3 pour Cloudflare R2
 * R2 est compatible avec l'API S3 d'AWS
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "cloudflare.r2.enabled", havingValue = "true", matchIfMissing = false)
public class CloudflareR2Config {

    private final CloudflareR2Properties r2Properties;

    @Bean
    public S3Client s3Client() {
        log.info("🚀 Initialisation Cloudflare R2 S3Client - Endpoint: {}, Bucket: {}", 
                r2Properties.getEndpoint(), r2Properties.getBucketName());
        
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                r2Properties.getAccessKey(),
                r2Properties.getSecretKey()
        );

        S3Client client = S3Client.builder()
                .endpointOverride(URI.create(r2Properties.getEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of("auto")) // R2 utilise "auto" comme région
                .build();
        
        log.info("✅ Cloudflare R2 S3Client initialisé avec succès");
        return client;
    }

    @Bean
    public S3Presigner s3Presigner() {
        log.info("🚀 Initialisation Cloudflare R2 S3Presigner");
        
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                r2Properties.getAccessKey(),
                r2Properties.getSecretKey()
        );

        S3Presigner presigner = S3Presigner.builder()
                .endpointOverride(URI.create(r2Properties.getEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of("auto"))
                .build();
        
        log.info("✅ Cloudflare R2 S3Presigner initialisé avec succès");
        return presigner;
    }
}
