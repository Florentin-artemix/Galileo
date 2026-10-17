package com.galileo.auth.security;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${galileo.jwt.secret}")
    private String jwtSecret;

    @Value("${galileo.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey key;
    private final SecureRandom secureRandom = new SecureRandom();

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException(
                    "ERREUR DE SÉCURITÉ CRITIQUE : La variable galileo.jwt.secret (JWT_SECRET) est obligatoire. " +
                    "L'application refuse de démarrer sans secret JWT valide (minimum 32 octets / 256 bits)."
            );
        }
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "ERREUR DE SÉCURITÉ CRITIQUE : La clé galileo.jwt.secret (JWT_SECRET) fait " + keyBytes.length +
                    " octets. Elle doit comporter au moins 32 octets (256 bits) pour l'algorithme HMAC-SHA256."
            );
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Génère un JWT d'accès contenant l'ID, l'email et le rôle de l'utilisateur
     */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    /**
     * Génère un refresh token sécurisé et imprévisible
     */
    public String generateRefreshTokenValue() {
        byte[] randomBytes = new byte[64];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Calcule le hachage cryptographique SHA-256 d'un jeton pour stockage sécurisé en base
     */
    public String hashToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Le jeton ne peut pas être vide");
        }
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algorithme de hachage SHA-256 indisponible", e);
        }
    }

    /**
     * Extrait l'email (subject) du jeton
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getSubject();
    }

    /**
     * Extrait l'ID utilisateur du jeton
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        } else if (userIdObj instanceof String) {
            return Long.parseLong((String) userIdObj);
        }
        return null;
    }

    /**
     * Extrait le rôle du jeton
     */
    public Role getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        String roleStr = claims.get("role", String.class);
        return roleStr != null ? Role.valueOf(roleStr) : Role.STUDENT;
    }

    /**
     * Valide la signature, l'intégrité et l'expiration du jeton
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            log.warn("Jeton JWT invalide ou signature corrompue: {}", e.getMessage());
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
