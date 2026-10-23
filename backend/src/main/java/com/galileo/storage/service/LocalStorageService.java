package com.galileo.storage.service;

import com.galileo.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Service("localStorageService")
public class LocalStorageService implements StorageService {

    @Value("${galileo.storage.local-dir:uploads}")
    private String localDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            rootLocation = Paths.get(localDir).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);
            log.info("Stockage local initialisé dans : {}", rootLocation);
        } catch (IOException e) {
            log.error("Impossible d'initialiser le répertoire de stockage local", e);
        }
    }

    @Override
    public String uploadFile(String key, InputStream inputStream, long contentLength, String contentType) {
        try {
            Path destinationFile = rootLocation.resolve(Paths.get(key)).normalize().toAbsolutePath();
            if (!destinationFile.startsWith(rootLocation)) {
                throw new SecurityException("Tentative d'écriture en dehors du répertoire autorisé");
            }
            Files.createDirectories(destinationFile.getParent());
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.debug("Fichier enregistré localement : {}", destinationFile);
            return key;
        } catch (IOException e) {
            throw new RuntimeException("Échec de l'enregistrement local du fichier", e);
        }
    }

    @Override
    public InputStream downloadFile(String key) {
        try {
            Path file = rootLocation.resolve(Paths.get(key)).normalize().toAbsolutePath();
            if (!file.startsWith(rootLocation) || !Files.exists(file)) {
                throw new ResourceNotFoundException("Fichier", "key", key);
            }
            return Files.newInputStream(file);
        } catch (IOException e) {
            throw new RuntimeException("Échec de lecture du fichier local", e);
        }
    }

    @Override
    public void deleteFile(String key) {
        try {
            Path file = rootLocation.resolve(Paths.get(key)).normalize().toAbsolutePath();
            if (file.startsWith(rootLocation) && Files.exists(file)) {
                Files.delete(file);
            }
        } catch (IOException e) {
            log.warn("Impossible de supprimer le fichier local : {}", key, e);
        }
    }

    @Override
    public String generatePresignedUrl(String key, int expirationMinutes) {
        // En mode local, on fournit l'URL relative de téléchargement API
        return "/api/documents/download/" + key;
    }
}
