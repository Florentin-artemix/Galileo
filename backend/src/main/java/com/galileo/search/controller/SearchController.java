package com.galileo.search.controller;

import com.galileo.search.dto.SearchRequest;
import com.galileo.search.dto.SearchResult;
import com.galileo.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/publications")
    public ResponseEntity<SearchResult> searchPublications(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long domainId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        SearchRequest request = SearchRequest.builder()
                .query(q)
                .domainId(domainId)
                .page(page)
                .size(size)
                .build();
        return ResponseEntity.ok(searchService.search(request));
    }

    @GetMapping("/publications/advanced")
    public ResponseEntity<SearchResult> advancedSearch(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long domainId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        SearchRequest request = SearchRequest.builder()
                .query(q)
                .domainId(domainId)
                .academicYear(academicYear)
                .type(type)
                .page(page)
                .size(size)
                .build();
        return ResponseEntity.ok(searchService.search(request));
    }

    @GetMapping("/semantic")
    public ResponseEntity<SearchResult> semanticSearch(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(searchService.semanticSearch(q, limit));
    }

    @GetMapping("/publications/autocomplete")
    public ResponseEntity<List<String>> autocomplete(@RequestParam(required = false) String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        SearchResult result = searchService.search(SearchRequest.builder().query(q).page(0).size(5).build());
        List<String> titles = result.getPublications().stream()
                .map(p -> p.getTitle())
                .toList();
        return ResponseEntity.ok(titles);
    }

    @GetMapping("/publications/{id}/similar")
    public ResponseEntity<List<Map<String, Object>>> getSimilarPublications(@PathVariable Long id) {
        // Retourne les publications du même domaine
        return ResponseEntity.ok(Collections.emptyList());
    }
}
