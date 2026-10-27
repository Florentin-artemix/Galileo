package com.galileo.auth;

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
import com.galileo.auth.service.AuthService;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.UnauthorizedException;
import com.galileo.users.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604800000L);
    }

    @Test
    @DisplayName("Public registration must not grant requested privileged roles")
    void registerShouldNotGrantRequestedPrivilegedRole() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@mapon.cd");
        request.setPassword("Secret12345");
        request.setFirstName("Jean");
        request.setLastName("Mukeba");
        request.setRole(Role.ADMIN);

        when(userRepository.existsByEmail("newuser@mapon.cd")).thenReturn(false);
        when(passwordEncoder.encode("Secret12345")).thenReturn("hashed-pwd");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(100L);
            return u;
        });
        when(tokenProvider.generateAccessToken(any(User.class))).thenReturn("fake-jwt-token");
        when(tokenProvider.generateRefreshTokenValue()).thenReturn("fake-refresh-token");
        when(tokenProvider.hashToken("fake-refresh-token")).thenReturn("hashed-fake-refresh-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("newuser@mapon.cd", response.getUser().getEmail());
        assertEquals("STUDENT", response.getUser().getRole());
        assertEquals("fake-jwt-token", response.getToken());

        verify(userRepository).save(argThat(user -> user.getRole() == Role.STUDENT));
        verify(refreshTokenRepository).save(argThat(token -> "hashed-fake-refresh-token".equals(token.getTokenHash())));
        verify(userProfileRepository).save(any());
    }

    @Test
    @DisplayName("Public registration may create a least-privilege VIEWER account")
    void registerShouldHonorViewerRole() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("viewer@mapon.cd");
        request.setPassword("Secret12345");
        request.setRole(Role.VIEWER);

        when(userRepository.existsByEmail("viewer@mapon.cd")).thenReturn(false);
        when(passwordEncoder.encode("Secret12345")).thenReturn("hashed-pwd");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(101L);
            return user;
        });
        when(tokenProvider.generateAccessToken(any(User.class))).thenReturn("viewer-jwt-token");
        when(tokenProvider.generateRefreshTokenValue()).thenReturn("viewer-refresh-token");
        when(tokenProvider.hashToken("viewer-refresh-token")).thenReturn("hashed-viewer-refresh-token");

        AuthResponse response = authService.register(request);

        assertEquals("VIEWER", response.getUser().getRole());
        verify(userRepository).save(argThat(user -> user.getRole() == Role.VIEWER));
    }

    @Test
    @DisplayName("Registration should reject duplicate email")
    void registerShouldRejectDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@mapon.cd");
        request.setPassword("Secret12345");

        when(userRepository.existsByEmail("existing@mapon.cd")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Registration should reject passwords shorter than 8 characters")
    void registerShouldRejectShortPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@mapon.cd");
        request.setPassword("short");

        when(userRepository.existsByEmail("test@mapon.cd")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login should authenticate active user and return JWT with hashed stored refresh token")
    void loginShouldReturnTokensForActiveUser() {
        LoginRequest request = new LoginRequest();
        request.setEmail("researcher@mapon.cd");
        request.setPassword("Password123");

        User activeUser = User.builder()
                .id(5L)
                .email("researcher@mapon.cd")
                .passwordHash("hashed-pwd")
                .role(Role.RESEARCHER)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("researcher@mapon.cd")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Password123", "hashed-pwd")).thenReturn(true);
        when(tokenProvider.generateAccessToken(activeUser)).thenReturn("jwt-token-5");
        when(tokenProvider.generateRefreshTokenValue()).thenReturn("refresh-token-5");
        when(tokenProvider.hashToken("refresh-token-5")).thenReturn("hashed-refresh-token-5");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("researcher@mapon.cd", response.getUser().getEmail());
        assertEquals("RESEARCHER", response.getUser().getRole());
        assertEquals("jwt-token-5", response.getToken());
        assertEquals("refresh-token-5", response.getRefreshToken());
        verify(refreshTokenRepository).save(argThat(token -> "hashed-refresh-token-5".equals(token.getTokenHash())));
    }

    @Test
    @DisplayName("Login should reject deactivated or suspended accounts")
    void loginShouldRejectInactiveUser() {
        LoginRequest request = new LoginRequest();
        request.setEmail("banned@mapon.cd");
        request.setPassword("Password123");

        User inactiveUser = User.builder()
                .id(7L)
                .email("banned@mapon.cd")
                .passwordHash("hashed-pwd")
                .role(Role.STUDENT)
                .isActive(false)
                .build();

        when(userRepository.findByEmail("banned@mapon.cd")).thenReturn(Optional.of(inactiveUser));
        when(passwordEncoder.matches("Password123", "hashed-pwd")).thenReturn(true);

        assertThrows(ForbiddenException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Login should reject wrong password with UnauthorizedException")
    void loginShouldRejectWrongPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@mapon.cd");
        request.setPassword("wrong-pass");

        User user = User.builder()
                .id(8L)
                .email("user@mapon.cd")
                .passwordHash("hashed-pwd")
                .role(Role.STUDENT)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("user@mapon.cd")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass", "hashed-pwd")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Refresh token flow should verify hash, revoke old token, and issue new rotated token")
    void refreshShouldIssueNewTokenWithRotation() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-raw-refresh-token");

        User user = User.builder()
                .id(20L)
                .email("teacher@mapon.cd")
                .role(Role.TEACHER)
                .isActive(true)
                .build();

        RefreshToken storedToken = RefreshToken.builder()
                .id(1L)
                .user(user)
                .tokenHash("hashed-valid-refresh-token")
                .expiresAt(LocalDateTime.now().plusDays(3))
                .revoked(false)
                .build();

        when(tokenProvider.hashToken("valid-raw-refresh-token")).thenReturn("hashed-valid-refresh-token");
        when(refreshTokenRepository.findByTokenHash("hashed-valid-refresh-token")).thenReturn(Optional.of(storedToken));
        when(tokenProvider.generateAccessToken(user)).thenReturn("new-access-jwt");
        when(tokenProvider.generateRefreshTokenValue()).thenReturn("new-raw-refresh-token");
        when(tokenProvider.hashToken("new-raw-refresh-token")).thenReturn("hashed-new-refresh-token");

        AuthResponse response = authService.refresh(request);

        assertNotNull(response);
        assertEquals("new-access-jwt", response.getToken());
        assertEquals("new-raw-refresh-token", response.getRefreshToken());
        assertTrue(storedToken.getRevoked());
        verify(refreshTokenRepository).save(storedToken);
        verify(refreshTokenRepository).save(argThat(t -> "hashed-new-refresh-token".equals(t.getTokenHash())));
    }

    @Test
    @DisplayName("Replay attack detection: Attempting to refresh with a revoked token revokes all user sessions")
    void refreshWithRevokedTokenShouldTriggerReplayAttackDefense() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("stolen-revoked-token");

        User user = User.builder()
                .id(30L)
                .email("victim@mapon.cd")
                .role(Role.STUDENT)
                .isActive(true)
                .build();

        RefreshToken revokedToken = RefreshToken.builder()
                .id(99L)
                .user(user)
                .tokenHash("hashed-stolen-token")
                .expiresAt(LocalDateTime.now().plusDays(2))
                .revoked(true)
                .build();

        RefreshToken otherActiveToken = RefreshToken.builder()
                .id(100L)
                .user(user)
                .tokenHash("other-hash")
                .expiresAt(LocalDateTime.now().plusDays(5))
                .revoked(false)
                .build();

        when(tokenProvider.hashToken("stolen-revoked-token")).thenReturn("hashed-stolen-token");
        when(refreshTokenRepository.findByTokenHash("hashed-stolen-token")).thenReturn(Optional.of(revokedToken));
        when(refreshTokenRepository.findByUserId(30L)).thenReturn(List.of(revokedToken, otherActiveToken));

        assertThrows(UnauthorizedException.class, () -> authService.refresh(request));
        assertTrue(otherActiveToken.getRevoked());
        verify(refreshTokenRepository).save(otherActiveToken);
    }

    @Test
    @DisplayName("Expired refresh token should be revoked and rejected with UnauthorizedException")
    void refreshWithExpiredTokenShouldBeRejected() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("expired-token");

        User user = User.builder().id(40L).email("user@mapon.cd").role(Role.STUDENT).build();
        RefreshToken expiredToken = RefreshToken.builder()
                .id(10L)
                .user(user)
                .tokenHash("hashed-expired-token")
                .expiresAt(LocalDateTime.now().minusHours(1))
                .revoked(false)
                .build();

        when(tokenProvider.hashToken("expired-token")).thenReturn("hashed-expired-token");
        when(refreshTokenRepository.findByTokenHash("hashed-expired-token")).thenReturn(Optional.of(expiredToken));

        assertThrows(UnauthorizedException.class, () -> authService.refresh(request));
        assertTrue(expiredToken.getRevoked());
        verify(refreshTokenRepository).save(expiredToken);
    }
}
