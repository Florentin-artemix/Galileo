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
}
