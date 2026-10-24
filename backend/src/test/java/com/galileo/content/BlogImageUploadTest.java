package com.galileo.content;

import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetailsService;
import com.galileo.auth.security.JwtAuthenticationFilter;
import com.galileo.auth.security.JwtTokenProvider;
import com.galileo.auth.security.SecurityConfig;
import com.galileo.common.exception.GlobalExceptionHandler;
import com.galileo.content.controller.ContentController;
import com.galileo.content.repository.BlogPostRepository;
import com.galileo.content.repository.EventRepository;
import com.galileo.storage.service.StorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.io.InputStream;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ContentController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class BlogImageUploadTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BlogPostRepository blogPostRepository;

    @MockBean
    private EventRepository eventRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private StorageService storageService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    // Signature JPEG valide : FF D8 FF E0 00 10 4A 46 49 46 00 01
    private static final byte[] VALID_JPEG_BYTES = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
    };

    // Signature PNG valide : 89 50 4E 47 0D 0A 1A 0A
    private static final byte[] VALID_PNG_BYTES = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    @Test
    @DisplayName("Upload valide par un ADMIN doit retourner 200 avec imageUrl et r2Key")
    @WithMockUser(roles = "ADMIN")
    void testValidUploadByAdmin() throws Exception {
        when(storageService.uploadFile(anyString(), any(InputStream.class), anyLong(), anyString()))
                .thenReturn("blog/test-uuid-photo.jpg");
        when(storageService.generatePresignedUrl(anyString(), anyInt()))
                .thenReturn("https://storage.galileo.local/blog/test-uuid-photo.jpg");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl", is("https://storage.galileo.local/blog/test-uuid-photo.jpg")))
                .andExpect(jsonPath("$.r2Key", notNullValue()))
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Upload valide par un STAFF doit retourner 200")
    @WithMockUser(roles = "STAFF")
    void testValidUploadByStaff() throws Exception {
        when(storageService.uploadFile(anyString(), any(InputStream.class), anyLong(), anyString()))
                .thenReturn("blog/test-uuid-diagram.png");
        when(storageService.generatePresignedUrl(anyString(), anyInt()))
                .thenReturn("https://storage.galileo.local/blog/test-uuid-diagram.png");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "diagram.png",
                "image/png",
                VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl", is("https://storage.galileo.local/blog/test-uuid-diagram.png")))
                .andExpect(jsonPath("$.r2Key", notNullValue()))
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Fichier vide doit être rejeté avec 400 Bad Request")
    @WithMockUser(roles = "ADMIN")
    void testEmptyFileRejected() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(emptyFile))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Format MIME non autorisé doit être rejeté avec 400 Bad Request")
    @WithMockUser(roles = "ADMIN")
    void testForbiddenMimeTypeRejected() throws Exception {
        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "script.sh",
                "application/x-sh",
                "echo malicious".getBytes()
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(textFile))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Signature magique falsifiée (extension .jpg mais contenu texte) doit être rejetée avec 400")
    @WithMockUser(roles = "ADMIN")
    void testSpoofedExtensionRejected() throws Exception {
        MockMultipartFile fakeFile = new MockMultipartFile(
                "file",
                "fake.jpg",
                "image/jpeg",
                "Ceci n'est pas une image JPEG".getBytes()
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(fakeFile))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Fichier supérieur à 10 Mo doit être rejeté avec 400 Bad Request")
    @WithMockUser(roles = "ADMIN")
    void testOversizedFileRejected() throws Exception {
        // Simuler un fichier de 11 Mo
        byte[] largeBytes = new byte[11 * 1024 * 1024];
        System.arraycopy(VALID_JPEG_BYTES, 0, largeBytes, 0, VALID_JPEG_BYTES.length);

        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.jpg",
                "image/jpeg",
                largeBytes
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(largeFile))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Accès non authentifié doit retourner 401 Unauthorized")
    void testUnauthenticatedAccessRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Accès avec rôle non autorisé (STUDENT) doit retourner 403 Forbidden")
    @WithMockUser(roles = "STUDENT")
    void testStudentRoleForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Échec du stockage sous-jacent doit lever une erreur HTTP 500 sans déclarer de succès")
    @WithMockUser(roles = "ADMIN")
    void testStorageFailureReturnsError() throws Exception {
        doThrow(new RuntimeException("S3 Connection Timeout"))
                .when(storageService).uploadFile(anyString(), any(InputStream.class), anyLong(), anyString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        mockMvc.perform(multipart("/api/blog/upload-image").file(file))
                .andExpect(status().isInternalServerError());
    }
}
