package com.galileo.auth;

import com.galileo.admin.controller.AdminController;
import com.galileo.auth.controller.AuthController;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetailsService;
import com.galileo.auth.security.JwtAuthenticationFilter;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.auth.security.SecurityConfig;
import com.galileo.auth.service.AuthService;
import com.galileo.publications.controller.PublicationController;
import com.galileo.publications.service.PublicationService;
import com.galileo.submissions.controller.SubmissionController;
import com.galileo.submissions.service.SubmissionService;
import com.galileo.users.repository.UserProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        AuthController.class,
        PublicationController.class,
        SubmissionController.class,
        AdminController.class
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class SecurityAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private PublicationService publicationService;

    @MockBean
    private SubmissionService submissionService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private UserProfileRepository userProfileRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    @DisplayName("Public publications catalog should be accessible anonymously")
    void publicPublicationsShouldBeAccessibleAnonymously() throws Exception {
        when(publicationService.getPublications(null, null, null, null, null, 0, 10))
                .thenReturn(Collections.emptyMap());

        mockMvc.perform(get("/api/publications")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Accessing private submissions anonymously must return 401 Unauthorized")
    void accessingSubmissionsAnonymouslyShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/soumissions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("User management API /api/admin/users must forbid STUDENT role with 403 Forbidden")
    @WithMockUser(username = "student@mapon.cd", roles = {"STUDENT"})
    void adminUsersShouldForbidStudent() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User management API /api/admin/users must allow ADMIN role with 200 OK")
    @WithMockUser(username = "admin@mapon.cd", roles = {"ADMIN"})
    void adminUsersShouldAllowAdmin() throws Exception {
        when(userRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Editorial moderation /api/admin/soumissions/en-attente must allow STAFF role")
    @WithMockUser(username = "staff@mapon.cd", roles = {"STAFF"})
    void adminSubmissionsShouldAllowStaff() throws Exception {
        when(submissionService.getPendingSubmissions()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/soumissions/en-attente")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Editorial moderation /api/admin/soumissions/en-attente must forbid STUDENT role")
    @WithMockUser(username = "student@mapon.cd", roles = {"STUDENT"})
    void adminSubmissionsShouldForbidStudent() throws Exception {
        mockMvc.perform(get("/api/admin/soumissions/en-attente")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
