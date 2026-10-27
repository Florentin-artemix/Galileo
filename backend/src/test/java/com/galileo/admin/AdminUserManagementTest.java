package com.galileo.admin;

import com.galileo.admin.controller.AdminController;
import com.galileo.admin.service.AdminService;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.auth.security.JwtAuthenticationFilter;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.auth.security.SecurityConfig;
import com.galileo.common.exception.GlobalExceptionHandler;
import com.galileo.submissions.service.SubmissionService;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class AdminUserManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubmissionService submissionService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private UserProfileRepository userProfileRepository;

    @MockBean
    private AdminService adminService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.galileo.auth.security.CustomUserDetailsService userDetailsService;

    private User createSampleUser(Long id, String email, Role role) {
        return User.builder()
                .id(id)
                .email(email)
                .role(role)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("GET /api/admin/users without pagination params returns unpaginated List of UserAdminDTO")
    @WithMockUser(roles = "ADMIN")
    void testGetAllUsersUnpaginated() throws Exception {
        User u = createSampleUser(1L, "alice@mapon.cd", Role.STUDENT);
        when(userRepository.findAll()).thenReturn(List.of(u));
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(UserProfile.builder().displayName("Alice Mapon").build()));

        mockMvc.perform(get("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].uid").value("1"))
                .andExpect(jsonPath("$[0].email").value("alice@mapon.cd"))
                .andExpect(jsonPath("$[0].role").value("STUDENT"))
                .andExpect(jsonPath("$[0].displayName").value("Alice Mapon"))
                .andExpect(jsonPath("$[0].disabled").value(false))
                .andExpect(jsonPath("$[0].isActive").value(true));
    }

    @Test
    @DisplayName("GET /api/admin/users?page=0&size=10 returns paginated Page of UserAdminDTO")
    @WithMockUser(roles = "ADMIN")
    void testGetAllUsersPaginated() throws Exception {
        User u = createSampleUser(2L, "bob@mapon.cd", Role.TEACHER);
        when(userRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(u)));
        when(userProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/users")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].email").value("bob@mapon.cd"))
                .andExpect(jsonPath("$.content[0].role").value("TEACHER"))
                .andExpect(jsonPath("$.content[0].displayName").value("bob"));
    }

    @Test
    @DisplayName("GET /api/admin/users with negative page returns 400 Bad Request")
    @WithMockUser(roles = "ADMIN")
    void testGetUsersNegativePage() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .param("page", "-1")
                        .param("size", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/admin/users with size <= 0 returns 400 Bad Request")
    @WithMockUser(roles = "ADMIN")
    void testGetUsersZeroSize() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .param("page", "0")
                        .param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/admin/users with excessive size > 100 returns 400 Bad Request")
    @WithMockUser(roles = "ADMIN")
    void testGetUsersExcessiveSize() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .param("page", "0")
                        .param("size", "150"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role with valid role updates user successfully")
    void testUpdateUserRoleSuccess() throws Exception {
        User adminUser = createSampleUser(99L, "admin@mapon.cd", Role.ADMIN);
        CustomUserDetails adminPrincipal = new CustomUserDetails(adminUser);
        User target = createSampleUser(10L, "target@mapon.cd", Role.STUDENT);

        when(userRepository.findById(10L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenReturn(target);

        mockMvc.perform(put("/api/admin/users/10/role")
                        .with(user(adminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"TEACHER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(userRepository).save(argThat(u -> u.getRole() == Role.TEACHER));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role with invalid role string returns 400 Bad Request")
    void testUpdateUserRoleInvalid() throws Exception {
        User adminUser = createSampleUser(99L, "admin@mapon.cd", Role.ADMIN);
        CustomUserDetails adminPrincipal = new CustomUserDetails(adminUser);

        mockMvc.perform(put("/api/admin/users/10/role")
                        .with(user(adminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"INVALID_ROLE\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Rôle invalide")));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role with VIEWER role updates user successfully")
    void testUpdateUserRoleViewerSuccess() throws Exception {
        User adminUser = createSampleUser(99L, "admin@mapon.cd", Role.ADMIN);
        CustomUserDetails adminPrincipal = new CustomUserDetails(adminUser);
        User target = createSampleUser(10L, "target@mapon.cd", Role.STUDENT);

        when(userRepository.findById(10L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenReturn(target);

        mockMvc.perform(put("/api/admin/users/10/role")
                        .with(user(adminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"VIEWER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(userRepository).save(argThat(u -> u.getRole() == Role.VIEWER));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role when admin attempts self-demotion returns 403 Forbidden")
    void testUpdateUserRoleSelfDemotionForbidden() throws Exception {
        User adminUser = createSampleUser(99L, "admin@mapon.cd", Role.ADMIN);
        CustomUserDetails adminPrincipal = new CustomUserDetails(adminUser);

        mockMvc.perform(put("/api/admin/users/99/role")
                        .with(user(adminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STUDENT\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role with non-numeric ID returns 400 Bad Request")
    void testUpdateUserRoleMalformedId() throws Exception {
        User adminUser = createSampleUser(99L, "admin@mapon.cd", Role.ADMIN);
        CustomUserDetails adminPrincipal = new CustomUserDetails(adminUser);

        mockMvc.perform(put("/api/admin/users/abc/role")
                        .with(user(adminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"TEACHER\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role with non-existent user returns 404 Not Found")
    void testUpdateUserRoleNotFound() throws Exception {
        User adminUser = createSampleUser(99L, "admin@mapon.cd", Role.ADMIN);
        CustomUserDetails adminPrincipal = new CustomUserDetails(adminUser);
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/admin/users/404/role")
                        .with(user(adminPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"RESEARCHER\"}"))
                .andExpect(status().isNotFound());
    }
}
