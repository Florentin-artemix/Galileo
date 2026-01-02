package com.galileo.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Configuration CORS globale pour la Gateway
 * Permet au frontend React de communiquer avec l'API
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Utiliser la configuration permissive par défaut et la personnaliser
        corsConfig.applyPermitDefaultValues();
        
        // Autoriser les origines du frontend (à adapter selon l'environnement)
        // Utiliser allowedOriginPatterns au lieu de allowedOrigins pour supporter allowCredentials
        corsConfig.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://galileo-frontend.com"
        ));
        
        // Autoriser tous les headers y compris x-user-role
        corsConfig.setAllowedHeaders(Arrays.asList("*"));
        
        // Exposer les headers personnalisés
        corsConfig.setExposedHeaders(Arrays.asList(
            "x-user-role",
            "X-User-Role"
        ));
        
        // Autoriser toutes les méthodes HTTP
        corsConfig.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // Autoriser les credentials (cookies, headers d'authentification)
        corsConfig.setAllowCredentials(true);
        
        // Durée de cache de la configuration CORS (en secondes)
        corsConfig.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        return new CorsWebFilter(source);
    }
}
