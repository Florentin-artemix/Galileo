package com.galileo.auth.controller;

import com.galileo.auth.dto.AuthResponse;
import com.galileo.auth.dto.LoginRequest;
import com.galileo.auth.dto.RefreshTokenRequest;
import com.galileo.auth.dto.RegisterRequest;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.auth.service.AuthService;
import com.galileo.common.dto.ApiResponse;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) Map<String, String> body) {
        String refreshToken = body != null ? body.get("refreshToken") : null;
        authService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok("Déconnexion réussie"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userDetails.getId()));

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "isActive", user.getIsActive(),
                "emailVerified", user.getEmailVerified(),
                "displayName", profile != null && profile.getDisplayName() != null ? profile.getDisplayName() : user.getEmail().split("@")[0],
                "avatarUrl", profile != null && profile.getAvatarUrl() != null ? profile.getAvatarUrl() : ""
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> body) {
        // Le service d'envoi d'emails SMTP n'étant pas encore relié en pré-production,
        // on retourne explicitement un statut 501 avec message explicatif
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "success", false,
                "message", "Le service d'envoi d'emails n'est pas encore activé. Veuillez contacter l'administrateur système pour réinitialiser votre mot de passe."
        ));
    }
}
