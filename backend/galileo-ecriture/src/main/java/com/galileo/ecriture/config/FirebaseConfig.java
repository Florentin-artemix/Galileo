package com.galileo.ecriture.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Configuration Firebase Admin SDK pour le service Ecriture
 * Permet la gestion des utilisateurs et de leurs rôles via Firebase
 */
@Configuration
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = false)
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.credentials.path:config/firebase-credentials.json}")
    private String credentialsPath;

    @Bean
    public FirebaseApp initializeFirebase() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                if (!Files.exists(Paths.get(credentialsPath))) {
                    logger.warn("Firebase credentials file not found at: {}", credentialsPath);
                    logger.warn("Firebase authentication will be disabled");
                    return null;
                }
                
                FileInputStream serviceAccount = new FileInputStream(credentialsPath);
                
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

                FirebaseApp app = FirebaseApp.initializeApp(options);
                logger.info("Firebase Admin SDK initialized successfully for service Ecriture");
                return app;
            } catch (IOException e) {
                logger.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
                return null;
            }
        }
        return FirebaseApp.getInstance();
    }
}
