package com.galileo.storage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Slf4j
@Primary
@Service
@RequiredArgsConstructor
public class DelegatingStorageService implements StorageService {

    private final CloudflareR2StorageService r2StorageService;
    private final LocalStorageService localStorageService;

    @Value("${galileo.storage.type:local}")
    private String configuredType;

    private StorageService getActiveService() {
        if ("r2".equalsIgnoreCase(configuredType)) {
            if (!r2StorageService.isConfigured()) {
                throw new IllegalStateException(
                        "Configuration de stockage invalide : STORAGE_TYPE est configuré sur 'r2', " +
                        "mais Cloudflare R2 n'est pas correctement configuré (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID ou R2_SECRET_ACCESS_KEY manquant). " +
                        "Le repli silencieux vers le stockage local temporaire est strictement interdit en production."
                );
            }
            return r2StorageService;
        }
        return localStorageService;
    }

    @Override
    public String uploadFile(String key, InputStream inputStream, long contentLength, String contentType) {
        return getActiveService().uploadFile(key, inputStream, contentLength, contentType);
    }

    @Override
    public InputStream downloadFile(String key) {
        return getActiveService().downloadFile(key);
    }

    @Override
    public void deleteFile(String key) {
        getActiveService().deleteFile(key);
    }

    @Override
    public String generatePresignedUrl(String key, int expirationMinutes) {
        return getActiveService().generatePresignedUrl(key, expirationMinutes);
    }
}
