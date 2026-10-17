package com.galileo.search.controller;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.publications.dto.PublicationDTO;
import com.galileo.search.dto.SearchRequest;
import com.galileo.search.dto.SearchResult;
import com.galileo.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/publications")
    public ResponseEntity<SearchResult> searchPublications(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long domainId,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String academicYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SearchRequest request = SearchRequest.builder()
                .query(query != null ? query : q)
                .q(q != null ? q : query)
                .domainId(domainId)
                .domain(domain)
                .type(type)
                .academicYear(academicYear)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .direction(direction)
                .build();
        return ResponseEntity.ok(searchService.search(request, userDetails));
    }

    @GetMapping("/publications/advanced")
    public ResponseEntity<SearchResult> advancedSearch(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) Long domainId,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SearchRequest request = SearchRequest.builder()
                .query(query != null ? query : q)
                .q(q != null ? q : query)
                .title(title)
                .author(author)
                .domainId(domainId)
                .domain(domain)
                .academicYear(academicYear)
                .type(type)
                .language(language)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .direction(direction)
                .build();
        return ResponseEntity.ok(searchService.search(request, userDetails));
    }

    @GetMapping("/semantic")
    public ResponseEntity<SearchResult> semanticSearch(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String effectiveQuery = query != null ? query : q;
        return ResponseEntity.ok(searchService.semanticSearch(effectiveQuery, limit, userDetails));
    }

    @GetMapping({"/publications/autocomplete", "/suggestions"})
    public ResponseEntity<List<String>> autocomplete(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(searchService.getSuggestions(q));
    }

    @GetMapping("/publications/{id}/similar")
    public ResponseEntity<List<PublicationDTO>> getSimilarPublications(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(searchService.getSimilarPublications(id, limit, userDetails));
    }
}
