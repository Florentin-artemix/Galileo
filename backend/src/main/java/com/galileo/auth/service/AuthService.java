package com.galileo.auth.service;

import com.galileo.auth.dto.*;
import com.galileo.auth.entity.RefreshToken;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.RefreshTokenRepository;
import com.galileo.auth.repository.UserRepository;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.common.exception.UnauthorizedException;
import com.galileo.security.JwtTokenProvider;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email Address already in use!");
        }

        // Seule l'inscription STUDENT est autorisée publiquement par défaut (ou RESEARCHER selon les règles).
        // On force le rôle à STUDENT par mesure de sécurité.
        Role userRole = Role.STUDENT;

        User user = User.builder()
                .email(registerRequest.getEmail())
                .passwordHash(passwordEncoder.encode(registerRequest.getPassword()))
                .role(userRole)
                .isActive(true)
                .build();

        User result = userRepository.save(user);

        // Création du profil utilisateur
        UserProfile profile = UserProfile.builder()
                .user(result)
                .displayName(registerRequest.getDisplayName())
                .program(registerRequest.getProgram())
                .bio(registerRequest.getMotivation())
                .build();
        userProfileRepository.save(profile);

        // Authentifier le nouvel utilisateur
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getEmail(),
                        registerRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        RefreshToken refreshToken = createRefreshToken(result.getId());

        return AuthResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken.getTokenHash())
                .expiresIn(tokenProvider.getExpirationInMs() / 1000) // en secondes
                .tokenType("Bearer")
                .user(new UserDTO(result.getId(), result.getEmail(), profile.getDisplayName(), result.getRole()))
                .build();
    }

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", loginRequest.getEmail()));
                
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        String displayName = profile != null ? profile.getDisplayName() : null;

        RefreshToken refreshToken = createRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken.getTokenHash())
                .expiresIn(tokenProvider.getExpirationInMs() / 1000)
                .tokenType("Bearer")
                .user(new UserDTO(user.getId(), user.getEmail(), displayName, user.getRole()))
                .build();
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(UUID.randomUUID().toString()) // En théorie, il faudrait hasher le token, mais UUID est sûr s'il est généré de manière sécurisée
                .expiresAt(LocalDateTime.now().plusDays(7)) // Expiration 7 jours
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenRepository.findByTokenHash(requestRefreshToken)
                .map(this::verifyExpiration)
                .map(token -> {
                    User user = token.getUser();
                    String jwt = tokenProvider.generateTokenFromUsername(user.getEmail(), user.getRole().name());
                    
                    UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
                    String displayName = profile != null ? profile.getDisplayName() : null;

                    return AuthResponse.builder()
                            .accessToken(jwt)
                            .refreshToken(token.getTokenHash())
                            .expiresIn(tokenProvider.getExpirationInMs() / 1000)
                            .tokenType("Bearer")
                            .user(new UserDTO(user.getId(), user.getEmail(), displayName, user.getRole()))
                            .build();
                })
                .orElseThrow(() -> new UnauthorizedException("Refresh token is not in database!"));
    }

    private RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiresAt().isBefore(LocalDateTime.now()) || token.getRevoked()) {
            refreshTokenRepository.delete(token);
            throw new UnauthorizedException("Refresh token was expired or revoked. Please make a new signin request");
        }
        return token;
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        Optional<RefreshToken> token = refreshTokenRepository.findByTokenHash(refreshTokenValue);
        token.ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        String displayName = profile != null ? profile.getDisplayName() : null;
        
        return new UserDTO(user.getId(), user.getEmail(), displayName, user.getRole());
    }
}
