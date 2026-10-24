package com.galileo.users;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetailsService;
import com.galileo.auth.security.JwtAuthenticationFilter;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.auth.security.SecurityConfig;
import com.galileo.common.exception.GlobalExceptionHandler;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.recommendations.repository.FavoriteRepository;
import com.galileo.recommendations.repository.ReadingHistoryRepository;
import com.galileo.storage.service.StorageService;
import com.galileo.users.controller.UserProfileController;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserProfileController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class TeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private UserProfileRepository userProfileRepository;

    @MockBean
    private FavoriteRepository favoriteRepository;

    @MockBean
    private ReadingHistoryRepository readingHistoryRepository;

    @MockBean
    private PublicationRepository publicationRepository;

    @MockBean
    private StorageService storageService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("1. GET /api/public/team accessible sans authentification avec multiples rôles")
    void testPublicTeam_Unauthenticated_Success() throws Exception {
        User u1 = User.builder().id(1L).email("jean.dupont@mapon.cd").role(Role.ADMIN).isActive(true).build();
        User u2 = User.builder().id(2L).email("marie.curie@mapon.cd").role(Role.RESEARCHER).isActive(true).build();
        User u3 = User.builder().id(3L).email("albert.camus@mapon.cd").role(Role.TEACHER).isActive(true).build();
        User u4 = User.builder().id(4L).email("staff.galileo@mapon.cd").role(Role.STAFF).isActive(true).build();

        UserProfile p1 = UserProfile.builder().id(101L).user(u1).displayName("Pr. Jean Dupont").bio("Doyen et chercheur").department("Génie Informatique").build();
        UserProfile p2 = UserProfile.builder().id(102L).user(u2).displayName("Dr. Marie Curie").bio("Responsable laboratoire").department("Physique des Matériaux").build();

        when(userRepository.findByRoleInAndIsActiveTrueOrderByIdAsc(any())).thenReturn(List.of(u1, u2, u3, u4));
        when(userProfileRepository.findByUserIdIn(any())).thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/api/public/team"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(4)))
                // Vérification du contrat DTO et des clés requises
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].uid", is("1")))
                .andExpect(jsonPath("$[0].displayName", is("Pr. Jean Dupont")))
                .andExpect(jsonPath("$[0].name", is("Pr. Jean Dupont")))
                .andExpect(jsonPath("$[0].email", is("jean.dupont@mapon.cd")))
                .andExpect(jsonPath("$[0].role", is("ADMIN")))
                .andExpect(jsonPath("$[0].bio", is("Doyen et chercheur")))
                .andExpect(jsonPath("$[0].description", is("Doyen et chercheur")))
                .andExpect(jsonPath("$[0].department", is("Génie Informatique")))
                .andExpect(jsonPath("$[0].avatarUrl", notNullValue()))
                .andExpect(jsonPath("$[0].imageUrl", notNullValue()))
                .andExpect(jsonPath("$[0].location").doesNotExist())
                .andExpect(jsonPath("$[0].phone").doesNotExist())
                // Vérification des profils incomplets
                .andExpect(jsonPath("$[2].displayName", is("albert.camus"))) // fallback email
                .andExpect(jsonPath("$[2].avatarUrl", containsString("ui-avatars.com")));
    }

    @Test
    @DisplayName("3. GET /api/public/team quand aucun membre en base -> tableau vide [] avec HTTP 200")
    void testPublicTeam_Empty_ReturnsEmptyArray() throws Exception {
        when(userRepository.findByRoleInAndIsActiveTrueOrderByIdAsc(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/public/team"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(0)));
    }

    @Test
    @DisplayName("4. GET /api/public/team/role/{role} avec rôle valide (STAFF)")
    void testPublicTeamByRole_ValidRoleStaff_Success() throws Exception {
        User u = User.builder().id(5L).email("encadreur@mapon.cd").role(Role.STAFF).isActive(true).build();
        UserProfile p = UserProfile.builder().id(105L).user(u).displayName("M. Encadreur").department("Scolarité").build();

        when(userRepository.findByRoleAndIsActiveTrueOrderByIdAsc(Role.STAFF)).thenReturn(List.of(u));
        when(userProfileRepository.findByUserIdIn(any())).thenReturn(List.of(p));

        mockMvc.perform(get("/api/public/team/role/STAFF"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(1)))
                .andExpect(jsonPath("$[0].role", is("STAFF")))
                .andExpect(jsonPath("$[0].displayName", is("M. Encadreur")));
    }

    @Test
    @DisplayName("4b. GET /api/public/team/role/{role} insensible à la casse (admin)")
    void testPublicTeamByRole_CaseInsensitiveRole_Success() throws Exception {
        User u = User.builder().id(1L).email("admin@mapon.cd").role(Role.ADMIN).isActive(true).build();

        when(userRepository.findByRoleAndIsActiveTrueOrderByIdAsc(Role.ADMIN)).thenReturn(List.of(u));
        when(userProfileRepository.findByUserIdIn(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/public/team/role/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(1)))
                .andExpect(jsonPath("$[0].role", is("ADMIN")));
    }

    @Test
    @DisplayName("5. GET /api/public/team/role/{role} avec rôle inconnu -> HTTP 400 Bad Request")
    void testPublicTeamByRole_UnknownRole_BadRequest() throws Exception {
        mockMvc.perform(get("/api/public/team/role/ROLE_INVENTE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Rôle inconnu")));
    }

    @Test
    @DisplayName("5b. GET /api/public/team/role/{role} avec rôle non institutionnel (STUDENT) -> HTTP 400 Bad Request")
    void testPublicTeamByRole_StudentRole_BadRequest() throws Exception {
        mockMvc.perform(get("/api/public/team/role/STUDENT"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ne fait pas partie de l'équipe publique")));
    }

    @Test
    @DisplayName("11. Absence de doublons dans la liste retournée")
    void testPublicTeam_NoDuplicates() throws Exception {
        User u1 = User.builder().id(10L).email("u10@mapon.cd").role(Role.STAFF).isActive(true).build();
        User u2 = User.builder().id(20L).email("u20@mapon.cd").role(Role.TEACHER).isActive(true).build();

        when(userRepository.findByRoleInAndIsActiveTrueOrderByIdAsc(any())).thenReturn(List.of(u1, u2));
        when(userProfileRepository.findByUserIdIn(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/public/team"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(10)))
                .andExpect(jsonPath("$[1].id", is(20)))
                .andExpect(jsonPath("$[0].id", not(equalTo(20))));
    }
}

