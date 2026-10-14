package com.galileo.storage;

import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.storage.service.LocalStorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class StorageServiceTest {

    private LocalStorageService localStorageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        localStorageService = new LocalStorageService();
        ReflectionTestUtils.setField(localStorageService, "localDir", tempDir.toString());
        localStorageService.init();
    }

    @Test
    @DisplayName("Should successfully upload, retrieve, and delete a document locally")
    void shouldUploadAndDownloadFile() throws Exception {
        String key = "publications/1/test-document.pdf";
        byte[] content = "%PDF-1.4 sample content".getBytes(StandardCharsets.UTF_8);

        String savedKey = localStorageService.uploadFile(key, new ByteArrayInputStream(content), content.length, "application/pdf");
        assertEquals(key, savedKey);

        try (InputStream is = localStorageService.downloadFile(key)) {
            byte[] readBytes = is.readAllBytes();
            assertArrayEquals(content, readBytes);
        }

        String presignedUrl = localStorageService.generatePresignedUrl(key, 60);
        assertTrue(presignedUrl.contains(key));

        localStorageService.deleteFile(key);

        assertThrows(ResourceNotFoundException.class, () -> localStorageService.downloadFile(key));
    }

    @Test
    @DisplayName("Path traversal attacks should be rejected with SecurityException")
    void shouldPreventPathTraversal() {
        String maliciousKey = "../../../etc/passwd";
        byte[] content = "malicious".getBytes(StandardCharsets.UTF_8);

        assertThrows(SecurityException.class, () -> 
                localStorageService.uploadFile(maliciousKey, new ByteArrayInputStream(content), content.length, "text/plain")
        );
    }
}
