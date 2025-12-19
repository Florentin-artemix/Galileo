package com.galileo.gateway.filter;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Filtre d'authentification Firebase pour la Gateway
 * Vérifie le token JWT Firebase dans le header Authorization
 */
@Slf4j
@Component
public class FirebaseAuthenticationFilter extends AbstractGatewayFilterFactory<FirebaseAuthenticationFilter.Config> {

    public FirebaseAuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            
            // Vérifier la présence du header Authorization
            if (!request.getHeaders().containsKey("Authorization")) {
                return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
            }
            
            String authHeader = request.getHeaders().getFirst("Authorization");
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
            }
            
            String token = authHeader.substring(7); // Retirer "Bearer "
            
            try {
                // Vérifier le token Firebase
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                String uid = decodedToken.getUid();
                String email = decodedToken.getEmail();
                
                // Récupérer le rôle depuis les custom claims Firebase
                Object roleClaim = decodedToken.getClaims().get("role");
                String role = null;
                
                if (roleClaim != null) {
                    String raw = roleClaim.toString().toUpperCase();
                    if (raw.equals("ADMIN") || raw.equals("STAFF") || raw.equals("STUDENT") || raw.equals("VIEWER")) {
                        role = raw;
                    }
                }
                
                // Si pas de rôle dans Firebase, utiliser le header X-User-Role du frontend
                if (role == null) {
                    String frontendRole = request.getHeaders().getFirst("X-User-Role");
                    if (frontendRole != null) {
                        String normalized = frontendRole.toUpperCase();
                        if (normalized.equals("ADMIN") || normalized.equals("STAFF") || 
                            normalized.equals("STUDENT") || normalized.equals("VIEWER")) {
                            role = normalized;
                            log.info("Using frontend role header for user {}: {}", email, role);
                        }
                    }
                }
                
                // Défaut à VIEWER si toujours pas de rôle
                if (role == null) {
                    role = "VIEWER";
                }
                
                log.info("Request authenticated for user: {} ({}) with role {}", email, uid, role);
                
                // Ajouter les informations de l'utilisateur dans les headers pour les microservices
                ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", uid)
                    .header("X-User-Email", email)
                    .header("X-User-Role", role)
                    .build();
                
                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                
            } catch (FirebaseAuthException e) {
                log.error("Firebase authentication failed: {}", e.getMessage());
                return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
            } catch (Exception e) {
                log.error("Authentication error: {}", e.getMessage());
                return onError(exchange, "Authentication error", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        };
    }
    
    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        log.warn("Authentication failed: {}", message);
        return response.setComplete();
    }

    public static class Config {
        // Configuration options if needed
    }
}
