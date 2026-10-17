package com.galileo.documents.controller;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.documents.dto.DocumentDTO;
import com.galileo.documents.service.DocumentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> getDocumentById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(documentService.getDocumentById(id, userDetails));
    }

    @GetMapping("/publication/{publicationId}")
    public ResponseEntity<DocumentDTO> getDocumentByPublicationId(
            @PathVariable Long publicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(documentService.getDocumentByPublicationId(publicationId, userDetails));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        DocumentDTO dto = documentService.getDocumentById(id, userDetails);
        InputStream is = documentService.getDocumentStream(id, userDetails);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + dto.getFileName() + "\"")
                .body(new InputStreamResource(is));
    }

    @GetMapping("/{id}/url")
    public ResponseEntity<Map<String, String>> getPresignedUrl(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String url = documentService.getPresignedDownloadUrl(id, userDetails);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/download/**")
    public ResponseEntity<InputStreamResource> downloadByKey(
            HttpServletRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String fullPath = request.getRequestURI();
        String fileKey = fullPath.substring("/api/documents/download/".length());

        InputStream is = documentService.getDocumentStreamByKey(fileKey, userDetails);
        String filename = fileKey.contains("/") ? fileKey.substring(fileKey.lastIndexOf("/") + 1) : fileKey;

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(new InputStreamResource(is));
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentDTO> uploadDocument(
            @RequestParam("publicationId") Long publicationId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        DocumentDTO result = documentService.uploadDocument(publicationId, file, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<DocumentDTO> retryProcessing(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(documentService.retryDocumentProcessing(id, userDetails));
    }

    @PostMapping("/publication/{publicationId}/retry")
    public ResponseEntity<DocumentDTO> retryByPublication(
            @PathVariable Long publicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(documentService.retryByPublicationId(publicationId, userDetails));
    }
}
