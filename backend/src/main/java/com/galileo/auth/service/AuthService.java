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

        // Sécurité des rôles : L'inscription publique attribue STRICTEMENT le rôle STUDENT
        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .isActive(true)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);

        // Création automatique du profil utilisateur associé
        String displayName = (request.getFirstName() != null ? request.getFirstName() : "") +
                (request.getLastName() != null ? " " + request.getLastName() : "");
        displayName = displayName.trim();
        if (displayName.isEmpty()) {
            displayName = normalizedEmail.split("@")[0];
        }

        UserProfile profile = UserProfile.builder()
                .user(user)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .displayName(displayName)
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

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Jeton de rafraîchissement invalide"));

        if (Boolean.TRUE.equals(refreshToken.getRevoked())) {
            throw new UnauthorizedException("Ce jeton a été révoqué");
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

        String newAccessToken = tokenProvider.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(request.getRefreshToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue != null) {
            refreshTokenRepository.findByTokenHash(refreshTokenValue).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    private String createAndSaveRefreshToken(User user) {
        String tokenValue = tokenProvider.generateRefreshTokenValue();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenValue)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }
}
