package com.galileo.gateway.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

/**
 * Configuration Firebase Admin SDK
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.path:config/firebase-credentials.json}")
    private String credentialsPath;

    @Bean
    public FirebaseApp initializeFirebase() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                FileInputStream serviceAccount = new FileInputStream(credentialsPath);
                
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

                FirebaseApp app = FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
                return app;
            } catch (IOException e) {
                log.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
                throw e;
            }
        }
        return FirebaseApp.getInstance();
    }
}
