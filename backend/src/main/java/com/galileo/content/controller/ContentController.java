package com.galileo.content.controller;

import com.galileo.common.dto.ApiResponse;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.content.entity.BlogPost;
import com.galileo.content.entity.Event;
import com.galileo.content.repository.BlogPostRepository;
import com.galileo.content.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class ContentController {

    private final BlogPostRepository blogPostRepository;
    private final EventRepository eventRepository;

    // ==========================================
    // BLOG (/api/blog)
    // ==========================================

    @GetMapping("/api/blog")
    public ResponseEntity<Page<Map<String, Object>>> getBlogPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("publishedAt").descending());
        Page<BlogPost> blogPage = blogPostRepository.findAll(pageable);
        return ResponseEntity.ok(blogPage.map(this::toBlogMap));
    }

    @GetMapping("/api/blog/{id}")
    public ResponseEntity<Map<String, Object>> getBlogPostById(@PathVariable Long id) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article de blog", "id", id));
        return ResponseEntity.ok(toBlogMap(post));
    }

    @GetMapping("/api/blog/recents")
    public ResponseEntity<List<Map<String, Object>>> getRecentBlogPosts() {
        Pageable pageable = PageRequest.of(0, 5, Sort.by("publishedAt").descending());
        return ResponseEntity.ok(blogPostRepository.findAll(pageable).map(this::toBlogMap).getContent());
    }

    // ==========================================
    // ÉVÉNEMENTS (/api/evenements, /api/events)
    // ==========================================

    @GetMapping({"/api/evenements", "/api/events"})
    public ResponseEntity<List<Map<String, Object>>> getEvents() {
        List<Event> events = eventRepository.findAll(Sort.by("eventDate").descending());
        return ResponseEntity.ok(events.stream().map(this::toEventMap).toList());
    }

    @GetMapping({"/api/evenements/{id}", "/api/events/{id}"})
    public ResponseEntity<Map<String, Object>> getEventById(@PathVariable Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", "id", id));
        return ResponseEntity.ok(toEventMap(event));
    }

    @PostMapping({"/api/evenements", "/api/events"})
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> createEvent(@RequestBody Map<String, Object> body) {
        String titleStr = extractBilingual(body.get("title"));
        String descStr = extractBilingual(body.get("description"));
        String location = (String) body.get("location");
        String organizer = (String) body.getOrDefault("organizer", "Faculté Polytechnique");

        Event event = Event.builder()
                .title(titleStr)
                .description(descStr)
                .location(location)
                .eventDate(LocalDateTime.now().plusDays(7))
                .organizer(organizer)
                .isPublished(true)
                .build();
        event = eventRepository.save(event);

        return ResponseEntity.ok(toEventMap(event));
    }

    @DeleteMapping({"/api/evenements/{id}", "/api/events/{id}"})
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        eventRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Événement supprimé"));
    }

    private String extractBilingual(Object obj) {
        if (obj instanceof Map<?, ?> m) {
            Object fr = m.get("fr");
            if (fr != null) return fr.toString();
            Object en = m.get("en");
            if (en != null) return en.toString();
        } else if (obj != null) {
            return obj.toString();
        }
        return "Sans titre";
    }

    private Map<String, Object> toBlogMap(BlogPost b) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", b.getId());
        map.put("titre", b.getTitle());
        map.put("title", b.getTitle());
        map.put("slug", b.getSlug());
        map.put("resume", b.getExcerpt());
        map.put("excerpt", b.getExcerpt());
        map.put("contenu", b.getContent());
        map.put("content", b.getContent());
        map.put("urlImagePrincipale", b.getCoverUrl());
        map.put("auteur", b.getAuthor() != null ? b.getAuthor().getEmail().split("@")[0] : "Galileo");
        map.put("datePublication", b.getPublishedAt() != null ? b.getPublishedAt().toString() : (b.getCreatedAt() != null ? b.getCreatedAt().toString() : ""));
        map.put("nombreVues", 0);
        return map;
    }

    private Map<String, Object> toEventMap(Event e) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", e.getId());
        map.put("title", Map.of("fr", e.getTitle(), "en", e.getTitle()));
        map.put("titre", e.getTitle());
        map.put("description", Map.of("fr", e.getDescription() != null ? e.getDescription() : "", "en", e.getDescription() != null ? e.getDescription() : ""));
        map.put("date", e.getEventDate() != null ? e.getEventDate().toString() : "");
        map.put("location", e.getLocation());
        map.put("organizer", e.getOrganizer());
        map.put("tags", Collections.emptyList());
        return map;
    }
}
