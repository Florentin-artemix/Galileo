package com.galileo.gateway.filter;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Base64;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * Filtre d'authentification Firebase pour la Gateway
 * Vérifie le token JWT Firebase dans le header Authorization
 * En cas d'échec de la vérification en ligne (403 de Google), 
 * utilise une validation basique du JWT et fait confiance aux headers du frontend
 */
@Slf4j
@Component
public class FirebaseAuthenticationFilter extends AbstractGatewayFilterFactory<FirebaseAuthenticationFilter.Config> {

    @Value("${firebase.project-id:galileo-67aeb}")
    private String projectId;

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
            
            String uid = null;
            String email = null;
            String role = null;
            
            try {
                // Essayer d'abord la vérification Firebase complète
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                uid = decodedToken.getUid();
                email = decodedToken.getEmail();
                
                // Récupérer le rôle depuis les custom claims Firebase
                Object roleClaim = decodedToken.getClaims().get("role");
                if (roleClaim != null) {
                    String raw = roleClaim.toString().toUpperCase();
                    if (raw.equals("ADMIN") || raw.equals("STAFF") || raw.equals("STUDENT") || raw.equals("VIEWER")) {
                        role = raw;
                    }
                }
                
                log.info("Firebase verification successful for user: {} ({})", email, uid);
                
            } catch (FirebaseAuthException e) {
                // En cas d'échec (403 de Google, etc.), faire une validation basique du JWT
                log.warn("Firebase online verification failed: {}. Trying fallback validation...", e.getMessage());
                
                try {
                    // Décoder le payload du JWT sans vérification de signature
                    String[] parts = token.split("\\.");
                    if (parts.length != 3) {
                        return onError(exchange, "Invalid JWT format", HttpStatus.UNAUTHORIZED);
                    }
                    
                    String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
                    JsonObject claims = JsonParser.parseString(payload).getAsJsonObject();
                    
                    // Vérifier l'audience et l'issuer
                    String aud = claims.has("aud") ? claims.get("aud").getAsString() : null;
                    String iss = claims.has("iss") ? claims.get("iss").getAsString() : null;
                    long exp = claims.has("exp") ? claims.get("exp").getAsLong() : 0;
                    
                    // Vérifier que le token est pour notre projet et n'est pas expiré
                    String expectedIssuer = "https://securetoken.google.com/" + projectId;
                    if (!projectId.equals(aud) || !expectedIssuer.equals(iss)) {
                        log.error("Token audience/issuer mismatch. Expected: {}/{}, Got: {}/{}", 
                                  projectId, expectedIssuer, aud, iss);
                        return onError(exchange, "Invalid token audience or issuer", HttpStatus.UNAUTHORIZED);
                    }
                    
                    // Vérifier l'expiration
                    long now = System.currentTimeMillis() / 1000;
                    if (exp < now) {
                        log.warn("Token expired at {}, current time: {}", exp, now);
                        return onError(exchange, "Token expired", HttpStatus.UNAUTHORIZED);
                    }
                    
                    // Extraire les informations du token
                    uid = claims.has("user_id") ? claims.get("user_id").getAsString() : 
                          (claims.has("sub") ? claims.get("sub").getAsString() : null);
                    email = claims.has("email") ? claims.get("email").getAsString() : null;
                    
                    if (uid == null) {
                        return onError(exchange, "No user ID in token", HttpStatus.UNAUTHORIZED);
                    }
                    
                    log.info("Fallback JWT validation successful for user: {} ({})", email, uid);
                    
                } catch (Exception fallbackError) {
                    log.error("Fallback JWT validation failed: {}", fallbackError.getMessage());
                    return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
                }
            } catch (Exception e) {
                log.error("Authentication error: {}", e.getMessage());
                return onError(exchange, "Authentication error", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            
            // Si pas de rôle trouvé dans Firebase, utiliser le header X-User-Role du frontend
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
            
            log.info("Request authenticated for user: {} ({}) with role {}", email, uid, role);
            
            // Ajouter les informations de l'utilisateur dans les headers pour les microservices
            ServerHttpRequest.Builder builder = request.mutate()
                .header("X-User-Id", uid)
                .header("X-User-Email", email != null ? email : "");
            if (role != null) {
                builder.header("X-User-Role", role);
            }
            
            return chain.filter(exchange.mutate().request(builder.build()).build());
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
