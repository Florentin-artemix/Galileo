package com.galileo.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuration CORS globale pour la Gateway
 * Permet au frontend React de communiquer avec l'API
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Autoriser les origines du frontend (à adapter selon l'environnement)
        corsConfig.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://galileo-frontend.com" // À remplacer par votre domaine
        ));
        
        // Autoriser tous les headers
        corsConfig.setAllowedHeaders(List.of("*"));
        
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
