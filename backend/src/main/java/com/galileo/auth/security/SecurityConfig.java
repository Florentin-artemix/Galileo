package com.galileo.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            objectMapper.writeValue(response.getWriter(), Map.of(
                                    "success", false,
                                    "status", 401,
                                    "error", "Unauthorized",
                                    "message", "Authentification requise pour accéder à cette ressource"
                            ));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            objectMapper.writeValue(response.getWriter(), Map.of(
                                    "success", false,
                                    "status", 403,
                                    "error", "Forbidden",
                                    "message", "Privilèges insuffisants pour effectuer cette opération"
                            ));
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Routes publiques d'authentification
                        .requestMatchers("/api/auth/**").permitAll()

                        // Documentation & Actuator health / info
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/api/actuator/health", "/api/actuator/info").permitAll()

                        // Endpoints publics en lecture
                        .requestMatchers(HttpMethod.GET, "/api/publications/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/publications/*/telechargement").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/publications/*/views").permitAll()
                        .requestMatchers("/api/search/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/blog/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/evenements/**", "/api/events/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/content/resources").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/documents/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/team/**").permitAll()

                        // Tracking public silencieux
                        .requestMatchers(HttpMethod.POST, "/api/analytics/track/**").permitAll()

                        // Administration & Gestion des utilisateurs (strictement ADMIN)
                        .requestMatchers("/api/admin/users/**").hasRole("ADMIN")

                        // Administration & Modération éditoriale (ADMIN et STAFF)
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers("/api/analytics/dashboard", "/api/analytics/global").hasAnyRole("ADMIN", "STAFF")

                        // Toutes les autres routes (soumissions, favoris, profil, historique, notifications) nécessitent une authentification
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @org.springframework.beans.factory.annotation.Value("${galileo.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
