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
    private final com.galileo.auth.repository.UserRepository userRepository;

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
    // RESSOURCES ACADÉMIQUES (/api/content/resources)
    // ==========================================

    @GetMapping("/api/content/resources")
    public ResponseEntity<List<Map<String, Object>>> getAcademicResources() {
        List<Map<String, Object>> categories = List.of(
            Map.of(
                "title", Map.of("fr", "Modèles & Templates", "en", "Models & Templates"),
                "description", Map.of("fr", "Utilisez nos modèles officiels pour formater votre manuscrit selon les standards de la revue.", "en", "Use our official templates to format your manuscript according to the journal standards."),
                "items", List.of(
                    Map.of(
                        "name", Map.of("fr", "Modèle d'article (LaTeX)", "en", "Article Template (LaTeX)"),
                        "description", Map.of("fr", "Archive .zip contenant le template LaTeX complet avec la classe de style Galileo et un exemple.", "en", ".zip archive containing the full LaTeX template with the Galileo style class and an example."),
                        "url", "/resources/GALILEO_Template_LaTeX.zip",
                        "format", "LaTeX"
                    ),
                    Map.of(
                        "name", Map.of("fr", "Modèle d'article (Word)", "en", "Article Template (Word)"),
                        "description", Map.of("fr", "Document .docx pré-formaté avec les styles de titres, de paragraphes et de citations recommandés.", "en", "Pre-formatted .docx document with recommended styles for titles, paragraphs, and citations."),
                        "url", "/resources/GALILEO_Template_Word.docx",
                        "format", "Word"
                    )
                )
            ),
            Map.of(
                "title", Map.of("fr", "Guides de Rédaction", "en", "Writing Guides"),
                "description", Map.of("fr", "Consultez nos guides pour améliorer la clarté, la structure et l'impact de votre article.", "en", "Consult our guides to improve the clarity, structure, and impact of your article."),
                "items", List.of(
                    Map.of(
                        "name", Map.of("fr", "Guide de Style (IEEE)", "en", "Style Guide (IEEE)"),
                        "description", Map.of("fr", "Résumé des normes de citation et de référencement IEEE à respecter dans votre manuscrit.", "en", "Summary of the IEEE citation and referencing standards to follow in your manuscript."),
                        "url", "/resources/GALILEO_Guide_Style_IEEE.pdf",
                        "format", "PDF"
                    ),
                    Map.of(
                        "name", Map.of("fr", "Checklist de Soumission", "en", "Submission Checklist"),
                        "description", Map.of("fr", "Document interactif pour vérifier que votre soumission est complète avant de l'envoyer.", "en", "Interactive document to ensure your submission is complete before sending it."),
                        "url", "/resources/GALILEO_Checklist.pdf",
                        "format", "PDF"
                    ),
                    Map.of(
                        "name", Map.of("fr", "Principes d'Éthique", "en", "Ethical Principles"),
                        "description", Map.of("fr", "Rappel de nos standards en matière d'originalité, de plagiat et d'intégrité scientifique.", "en", "Reminder of our standards regarding originality, plagiarism, and scientific integrity."),
                        "url", "/about#ethics",
                        "format", "Lien Web"
                    )
                )
            ),
            Map.of(
                "title", Map.of("fr", "Outils Recommandés", "en", "Recommended Tools"),
                "description", Map.of("fr", "Une sélection d'outils tiers pour vous assister dans vos recherches et la gestion de vos références.", "en", "A selection of third-party tools to assist you with your research and reference management."),
                "items", List.of(
                    Map.of(
                        "name", Map.of("fr", "Zotero (Gestionnaire Bibliographique)", "en", "Zotero (Reference Manager)"),
                        "description", Map.of("fr", "Outil libre et gratuit pour collecter, organiser, citer et partager vos sources de recherche.", "en", "Free, open-source tool to help you collect, organize, cite, and share research."),
                        "url", "https://www.zotero.org/",
                        "format", "Externe"
                    ),
                    Map.of(
                        "name", Map.of("fr", "Overleaf (Éditeur LaTeX Collaboratif)", "en", "Overleaf (Collaborative LaTeX Editor)"),
                        "description", Map.of("fr", "Éditeur LaTeX en ligne facile à utiliser, idéal pour la collaboration en temps réel sur des articles scientifiques.", "en", "An easy-to-use, online LaTeX editor, great for real-time collaboration on scientific papers."),
                        "url", "https://www.overleaf.com/",
                        "format", "Externe"
                    )
                )
            )
        );
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/api/blog")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> createBlogPost(
            @RequestBody Map<String, Object> body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.galileo.auth.security.CustomUserDetails userDetails
    ) {
        String title = (String) body.get("title");
        if (title == null || title.trim().isEmpty()) {
            title = (String) body.get("titre");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new com.galileo.common.exception.BadRequestException("Le titre de l'article est obligatoire");
        }

        String content = (String) body.getOrDefault("content", body.get("contenu"));
        String excerpt = (String) body.getOrDefault("excerpt", body.get("resume"));
        String coverUrl = (String) body.getOrDefault("coverUrl", body.get("urlImagePrincipale"));
        String slug = (String) body.get("slug");
        if (slug == null || slug.trim().isEmpty()) {
            slug = title.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + System.currentTimeMillis();
        }

        com.galileo.auth.entity.User author = null;
        if (userDetails != null) {
            author = userRepository.findById(userDetails.getId()).orElse(null);
        }

        BlogPost post = BlogPost.builder()
                .title(title)
                .slug(slug)
                .content(content)
                .excerpt(excerpt)
                .coverUrl(coverUrl)
                .author(author)
                .isPublished(true)
                .publishedAt(LocalDateTime.now())
                .build();
        post = blogPostRepository.save(post);
        return ResponseEntity.ok(toBlogMap(post));
    }

    @PutMapping("/api/blog/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> updateBlogPost(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article de blog", "id", id));

        if (body.containsKey("title")) post.setTitle((String) body.get("title"));
        if (body.containsKey("titre")) post.setTitle((String) body.get("titre"));
        if (body.containsKey("content")) post.setContent((String) body.get("content"));
        if (body.containsKey("contenu")) post.setContent((String) body.get("contenu"));
        if (body.containsKey("excerpt")) post.setExcerpt((String) body.get("excerpt"));
        if (body.containsKey("resume")) post.setExcerpt((String) body.get("resume"));
        if (body.containsKey("coverUrl")) post.setCoverUrl((String) body.get("coverUrl"));
        if (body.containsKey("urlImagePrincipale")) post.setCoverUrl((String) body.get("urlImagePrincipale"));
        if (body.containsKey("isPublished")) post.setIsPublished((Boolean) body.get("isPublished"));

        post = blogPostRepository.save(post);
        return ResponseEntity.ok(toBlogMap(post));
    }

    @DeleteMapping("/api/blog/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBlogPost(@PathVariable Long id) {
        blogPostRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Article supprimé"));
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

    @PutMapping({"/api/evenements/{id}", "/api/events/{id}"})
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> updateEvent(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", "id", id));

        if (body.containsKey("title") || body.containsKey("titre")) {
            event.setTitle(extractBilingual(body.containsKey("title") ? body.get("title") : body.get("titre")));
        }
        if (body.containsKey("description")) {
            event.setDescription(extractBilingual(body.get("description")));
        }
        if (body.containsKey("location")) {
            event.setLocation((String) body.get("location"));
        }
        if (body.containsKey("organizer")) {
            event.setOrganizer((String) body.get("organizer"));
        }
        if (body.containsKey("isPublished")) {
            event.setIsPublished((Boolean) body.get("isPublished"));
        }

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
