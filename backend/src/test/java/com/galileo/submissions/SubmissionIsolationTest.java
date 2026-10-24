package com.galileo.submissions;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.auth.security.JwtAuthenticationFilter;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.auth.security.SecurityConfig;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.GlobalExceptionHandler;
import com.galileo.submissions.controller.SubmissionController;
import com.galileo.submissions.service.SubmissionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SubmissionController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class SubmissionIsolationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubmissionService submissionService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.galileo.auth.security.CustomUserDetailsService userDetailsService;

    @Test
    @DisplayName("POST /api/soumissions rejects anonymous users with 401")
    void testSubmitAnonymousForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile("fichierPdf", "article.pdf", "application/pdf", "%PDF-1.4 test".getBytes());

        mockMvc.perform(multipart("/api/soumissions")
                        .file(file)
                        .param("titre", "Mon article")
                        .param("resume", "Résumé de recherche"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/soumissions allows STUDENT role to submit publication")
    void testSubmitStudentAllowed() throws Exception {
        User u = User.builder().id(10L).email("student@mapon.cd").role(Role.STUDENT).isActive(true).build();
        CustomUserDetails student = new CustomUserDetails(u);
        MockMultipartFile file = new MockMultipartFile("fichierPdf", "article.pdf", "application/pdf", "%PDF-1.4 test".getBytes());

        when(submissionService.createSubmission(anyLong(), any(), anyString(), anyString(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Map.of("id", 101L, "statut", "EN_ATTENTE"));

        mockMvc.perform(multipart("/api/soumissions")
                        .file(file)
                        .param("titre", "Mon article")
                        .param("resume", "Résumé de recherche")
                        .with(user(student)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101L));
    }

    @Test
    @DisplayName("GET /api/soumissions/{id} allows owner to read their submission")
    void testGetOwnSubmissionAllowed() throws Exception {
        User u = User.builder().id(10L).email("student@mapon.cd").role(Role.STUDENT).isActive(true).build();
        CustomUserDetails student = new CustomUserDetails(u);

        when(submissionService.getSubmissionById(eq(101L), eq(10L), eq(false)))
                .thenReturn(Map.of("id", 101L, "titre", "Mon article", "statut", "EN_ATTENTE"));

        mockMvc.perform(get("/api/soumissions/101")
                        .with(user(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titre").value("Mon article"));
    }

    @Test
    @DisplayName("GET /api/soumissions/{id} forbids student from reading another student's submission")
    void testGetOtherStudentSubmissionForbidden() throws Exception {
        User u = User.builder().id(10L).email("student@mapon.cd").role(Role.STUDENT).isActive(true).build();
        CustomUserDetails student = new CustomUserDetails(u);

        when(submissionService.getSubmissionById(eq(999L), eq(10L), eq(false)))
                .thenThrow(new ForbiddenException("Vous n'avez pas accès à cette soumission"));

        mockMvc.perform(get("/api/soumissions/999")
                        .with(user(student)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/soumissions/{id} allows STAFF to read any submission for editorial moderation")
    void testGetSubmissionStaffAllowed() throws Exception {
        User s = User.builder().id(50L).email("staff@mapon.cd").role(Role.STAFF).isActive(true).build();
        CustomUserDetails staff = new CustomUserDetails(s);

        when(submissionService.getSubmissionById(eq(999L), eq(50L), eq(true)))
                .thenReturn(Map.of("id", 999L, "titre", "Article en modération", "statut", "EN_ATTENTE"));

        mockMvc.perform(get("/api/soumissions/999")
                        .with(user(staff)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(999L));
    }
}
