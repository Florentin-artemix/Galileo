package com.galileo.notifications;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.auth.security.JwtAuthenticationFilter;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.auth.security.SecurityConfig;
import com.galileo.common.exception.GlobalExceptionHandler;
import com.galileo.notifications.controller.NotificationController;
import com.galileo.notifications.repository.NotificationPreferenceRepository;
import com.galileo.notifications.repository.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NotificationController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class NotificationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationRepository notificationRepository;

    @MockBean
    private NotificationPreferenceRepository preferenceRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.galileo.auth.security.CustomUserDetailsService userDetailsService;

    @Test
    @DisplayName("GET /api/notifications/1 rejects anonymous with 401")
    void testGetNotificationsAnonymous() throws Exception {
        mockMvc.perform(get("/api/notifications/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/notifications/1 allows user 1 to see their own notifications")
    void testGetNotificationsOwn() throws Exception {
        User u1 = User.builder().id(1L).email("student1@mapon.cd").role(Role.STUDENT).isActive(true).build();
        CustomUserDetails user1 = new CustomUserDetails(u1);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/notifications/1")
                        .with(user(user1))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/notifications/2 forbids user 1 from accessing user 2's notifications with 403")
    void testGetNotificationsOtherUserForbidden() throws Exception {
        User u1 = User.builder().id(1L).email("student1@mapon.cd").role(Role.STUDENT).isActive(true).build();
        CustomUserDetails user1 = new CustomUserDetails(u1);

        mockMvc.perform(get("/api/notifications/2")
                        .with(user(user1))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/notifications/2 allows STAFF to access user 2's notifications with 200")
    void testGetNotificationsStaffAllowed() throws Exception {
        User s = User.builder().id(99L).email("staff@mapon.cd").role(Role.STAFF).isActive(true).build();
        CustomUserDetails staff = new CustomUserDetails(s);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(2L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/notifications/2")
                        .with(user(staff))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
