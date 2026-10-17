package com.galileo.publications.controller;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.dto.ApiResponse;
import com.galileo.publications.dto.PublicationCreateDTO;
import com.galileo.publications.dto.PublicationDetailDTO;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.service.PublicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationService publicationService;

    @GetMapping
    public ResponseEntity<Page<Map<String, Object>>> getPublications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), sort);
        return ResponseEntity.ok(publicationService.getPublishedPublications(pageable, userDetails));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPublicationById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(publicationService.getPublicationById(id, userDetails));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<PublicationDetailDTO> getPublicationDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(publicationService.getPublicationDetail(id, userDetails));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> createPublication(
            @Valid @RequestBody PublicationCreateDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Map<String, Object> result = publicationService.createPublication(dto, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updatePublication(
            @PathVariable Long id,
            @Valid @RequestBody PublicationCreateDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(publicationService.updatePublication(id, dto, userDetails));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> updatePublicationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            statusStr = body.get("statut");
        }
        PublicationStatus status = PublicationStatus.valueOf(statusStr.toUpperCase());
        publicationService.updatePublicationStatus(id, status, userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Statut mis à jour avec succès"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deletePublication(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        publicationService.deletePublication(id, userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Publication supprimée avec succès"));
    }

    @GetMapping("/recentes")
    public ResponseEntity<List<Map<String, Object>>> getRecentPublications(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(publicationService.getRecentPublications(userDetails));
    }

    @GetMapping("/populaires")
    public ResponseEntity<List<Map<String, Object>>> getPopularPublications(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(publicationService.getPopularPublications(userDetails));
    }

    @GetMapping("/domaine/{domaine}")
    public ResponseEntity<Page<Map<String, Object>>> getByDomain(
            @PathVariable String domaine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("publishedAt").descending());
        return ResponseEntity.ok(publicationService.getByDomain(domaine, pageable, userDetails));
    }

    @GetMapping("/auteur/{auteur}")
    public ResponseEntity<Page<Map<String, Object>>> getByAuthor(
            @PathVariable String auteur,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("publishedAt").descending());
        return ResponseEntity.ok(publicationService.getByAuthor(auteur, pageable, userDetails));
    }

    @GetMapping("/{id}/telecharger")
    public ResponseEntity<Map<String, String>> getDownloadUrl(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String url = publicationService.getDownloadUrl(id, userDetails);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/{id}/telechargement")
    public ResponseEntity<Void> recordDownload(@PathVariable Long id) {
        publicationService.incrementDownloads(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/views")
    public ResponseEntity<Void> recordView(@PathVariable Long id) {
        publicationService.incrementViews(id);
        return ResponseEntity.ok().build();
    }
}
