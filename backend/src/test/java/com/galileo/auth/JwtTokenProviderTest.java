package com.galileo.auth;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secret = "TestSecretKeyForGalileoPreProductionSecurityMustBeAtLeast256BitsLong1234567890";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", secret);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 3600000L); // 1h
        jwtTokenProvider.init();
    }

    @Test
    @DisplayName("Should generate valid JWT token with user claims")
    void shouldGenerateValidToken() {
        User user = User.builder()
                .id(42L)
                .email("student@mapon.cd")
                .role(Role.STUDENT)
                .build();

        String token = jwtTokenProvider.generateAccessToken(user);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("student@mapon.cd", jwtTokenProvider.getEmailFromToken(token));
        assertEquals(42L, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals(Role.STUDENT, jwtTokenProvider.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Should reject invalid or tampered JWT token")
    void shouldRejectTamperedToken() {
        User user = User.builder()
                .id(1L)
                .email("admin@mapon.cd")
                .role(Role.ADMIN)
                .build();

        String token = jwtTokenProvider.generateAccessToken(user);
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertFalse(jwtTokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("Should reject expired JWT token")
    void shouldRejectExpiredToken() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(expiredProvider, "jwtSecret", secret);
        ReflectionTestUtils.setField(expiredProvider, "jwtExpirationMs", -1000L); // expired 1s ago
        expiredProvider.init();

        User user = User.builder()
                .id(10L)
                .email("user@mapon.cd")
                .role(Role.STUDENT)
                .build();

        String token = expiredProvider.generateAccessToken(user);

        assertFalse(jwtTokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("Should generate random refresh token of proper length")
    void shouldGenerateRandomRefreshToken() {
        String refreshToken1 = jwtTokenProvider.generateRefreshTokenValue();
        String refreshToken2 = jwtTokenProvider.generateRefreshTokenValue();

        assertNotNull(refreshToken1);
        assertNotNull(refreshToken2);
        assertNotEquals(refreshToken1, refreshToken2);
        assertTrue(refreshToken1.length() >= 64);
    }

    @Test
    @DisplayName("Should strictly reject missing or secret shorter than 32 bytes (256 bits) with IllegalStateException")
    void shouldRejectMissingOrShortSecret() {
        JwtTokenProvider missingProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(missingProvider, "jwtSecret", "");
        assertThrows(IllegalStateException.class, missingProvider::init);

        JwtTokenProvider shortProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortProvider, "jwtSecret", "too-short-secret-under-32-b");
        assertThrows(IllegalStateException.class, shortProvider::init);
    }

    @Test
    @DisplayName("Should hash token with SHA-256 to consistent 64-character hexadecimal format")
    void shouldProperlyHashTokenWithSha256() {
        String token = "my-secret-refresh-token-12345";
        String hash1 = jwtTokenProvider.hashToken(token);
        String hash2 = jwtTokenProvider.hashToken(token);

        assertNotNull(hash1);
        assertEquals(64, hash1.length());
        assertEquals(hash1, hash2);
        assertNotEquals(token, hash1);
    }
}
