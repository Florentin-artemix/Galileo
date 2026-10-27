package com.galileo.documents;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.auth.security.CustomUserDetailsService;
import com.galileo.auth.security.JwtAuthenticationFilter;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.auth.security.SecurityConfig;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.GlobalExceptionHandler;
import com.galileo.documents.controller.DocumentController;
import com.galileo.documents.dto.DocumentDTO;
import com.galileo.documents.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DocumentController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class DocumentDownloadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void authenticatedDownloadRespondsWithInlinePdfHeaders() throws Exception {
        CustomUserDetails student = new CustomUserDetails(User.builder()
                .id(22L)
                .email("student@example.test")
                .role(Role.STUDENT)
                .isActive(true)
                .build());
        when(documentService.getDocumentById(42L, student)).thenReturn(DocumentDTO.builder()
                .id(42L)
                .fileName("paper.pdf")
                .build());
        when(documentService.getDocumentStream(42L, student))
                .thenReturn(new ByteArrayInputStream("%PDF-1.4".getBytes()));

        mockMvc.perform(get("/api/documents/42/download").with(user(student)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "inline; filename=\"paper.pdf\""));
    }

    @Test
    void anonymousDownloadIsRejectedByDocumentServicePolicy() throws Exception {
        when(documentService.getDocumentById(eq(42L), isNull()))
                .thenThrow(new ForbiddenException("Accès non autorisé à ce document"));

        mockMvc.perform(get("/api/documents/42/download"))
                .andExpect(status().isForbidden());
    }
}
