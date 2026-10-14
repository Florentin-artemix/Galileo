package com.galileo.publications.controller;

import com.galileo.publications.service.PublicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
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
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), sort);
        return ResponseEntity.ok(publicationService.getPublishedPublications(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPublicationById(@PathVariable Long id) {
        return ResponseEntity.ok(publicationService.getPublicationById(id));
    }

    @GetMapping("/recentes")
    public ResponseEntity<List<Map<String, Object>>> getRecentPublications() {
        return ResponseEntity.ok(publicationService.getRecentPublications());
    }

    @GetMapping("/populaires")
    public ResponseEntity<List<Map<String, Object>>> getPopularPublications() {
        return ResponseEntity.ok(publicationService.getPopularPublications());
    }

    @GetMapping("/domaine/{domaine}")
    public ResponseEntity<Page<Map<String, Object>>> getByDomain(
            @PathVariable String domaine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("publishedAt").descending());
        return ResponseEntity.ok(publicationService.getByDomain(domaine, pageable));
    }

    @GetMapping("/auteur/{auteur}")
    public ResponseEntity<Page<Map<String, Object>>> getByAuthor(
            @PathVariable String auteur,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("publishedAt").descending());
        return ResponseEntity.ok(publicationService.getByAuthor(auteur, pageable));
    }

    @GetMapping("/{id}/telecharger")
    public ResponseEntity<Map<String, String>> getDownloadUrl(@PathVariable Long id) {
        String url = publicationService.getDownloadUrl(id);
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
