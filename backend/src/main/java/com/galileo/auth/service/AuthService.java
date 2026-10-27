package com.galileo.auth.service;

import com.galileo.auth.dto.AuthResponse;
import com.galileo.auth.dto.LoginRequest;
import com.galileo.auth.dto.RefreshTokenRequest;
import com.galileo.auth.dto.RegisterRequest;
import com.galileo.auth.entity.RefreshToken;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.RefreshTokenRepository;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.UnauthorizedException;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Value("${galileo.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("L'adresse email est requise");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Un compte existe déjà avec cette adresse email");
        }

        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new BadRequestException("Le mot de passe doit contenir au moins 8 caractères");
        }

        // L'inscription publique ne conserve que le rôle de consultation non privilégié.
        Role registrationRole = request.getRole() == Role.VIEWER ? Role.VIEWER : Role.STUDENT;
        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(registrationRole)
                .isActive(true)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);

        // Création automatique du profil utilisateur associé
        String displayName = request.getDisplayName() != null && !request.getDisplayName().trim().isEmpty()
                ? request.getDisplayName().trim()
                : ((request.getFirstName() != null ? request.getFirstName() : "") +
                   (request.getLastName() != null ? " " + request.getLastName() : "")).trim();
        if (displayName.isEmpty()) {
            displayName = normalizedEmail.split("@")[0];
        }

        UserProfile profile = UserProfile.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .displayName(displayName)
                .program(request.getProgram())
                .department(request.getProgram())
                .bio(request.getMotivation())
                .build();
        userProfileRepository.save(profile);

        String accessToken = tokenProvider.generateAccessToken(user);
        String refreshTokenValue = createAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new BadRequestException("Email et mot de passe requis");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Identifiants invalides"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Identifiants invalides");
        }

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new ForbiddenException("Votre compte est désactivé. Veuillez contacter l'administration.");
        }

        String accessToken = tokenProvider.generateAccessToken(user);
        String refreshTokenValue = createAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (request.getRefreshToken() == null || request.getRefreshToken().trim().isEmpty()) {
            throw new BadRequestException("Jeton de rafraîchissement requis");
        }

        String rawToken = request.getRefreshToken().trim();
        String tokenHash = tokenProvider.hashToken(rawToken);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Jeton de rafraîchissement invalide"));

        // Détection de rejeu et d'attaque par vol de refresh token
        if (Boolean.TRUE.equals(refreshToken.getRevoked())) {
            log.warn("ALERTE SÉCURITÉ: Tentative de réutilisation d'un refresh token révoqué pour utilisateur #{}",
                    refreshToken.getUser().getId());
            // Révoquer immédiatement tous les jetons actifs de cet utilisateur compromis
            refreshTokenRepository.findByUserId(refreshToken.getUser().getId()).forEach(t -> {
                t.setRevoked(true);
                refreshTokenRepository.save(t);
            });
            throw new UnauthorizedException("Alerte de sécurité : jeton déjà utilisé ou révoqué");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new UnauthorizedException("Jeton de rafraîchissement expiré");
        }

        User user = refreshToken.getUser();
        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new ForbiddenException("Ce compte est désactivé");
        }

        // Invalidation de l'ancien jeton utilisé (Rotation)
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        String newAccessToken = tokenProvider.generateAccessToken(user);
        String newRefreshToken = createAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        return refreshToken(request);
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue != null && !refreshTokenValue.trim().isEmpty()) {
            try {
                String tokenHash = tokenProvider.hashToken(refreshTokenValue.trim());
                refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
            } catch (Exception e) {
                log.warn("Impossible de révoquer le refresh token lors de la déconnexion : {}", e.getMessage());
            }
        }
    }

    private String createAndSaveRefreshToken(User user) {
        String tokenValue = tokenProvider.generateRefreshTokenValue();
        String tokenHash = tokenProvider.hashToken(tokenValue);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }

    public com.galileo.auth.dto.UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.galileo.common.exception.ResourceNotFoundException("User", "email", email));
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        String displayName = profile != null ? profile.getDisplayName() : null;

        return new com.galileo.auth.dto.UserDTO(user.getId(), user.getEmail(), displayName, user.getRole());
    }
}
