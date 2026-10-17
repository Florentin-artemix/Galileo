package com.galileo.recommendations.controller;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.dto.ApiResponse;
import com.galileo.publications.dto.PublicationDTO;
import com.galileo.recommendations.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    // ==========================================
    // RECOMMANDATIONS PERSONNALISÉES
    // ==========================================

    @GetMapping("/api/recommendations")
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getId() : 1L;
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(userId, limit));
    }

    @PatchMapping("/api/recommendations/{id}/seen")
    public ResponseEntity<ApiResponse<Void>> markSeen(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails != null) {
            recommendationService.markRecommendationSeen(id, userDetails.getId());
        }
        return ResponseEntity.ok(ApiResponse.ok("Marqué comme vu"));
    }

    // ==========================================
    // SUIVI DES AUTEURS
    // ==========================================

    @PostMapping({"/api/recommendations/authors/{authorId}", "/api/recommendations/authors/{authorId}/follow"})
    public ResponseEntity<ApiResponse<Void>> followAuthor(
            @PathVariable Long authorId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        recommendationService.followAuthor(userDetails.getId(), authorId);
        return ResponseEntity.ok(ApiResponse.ok("Auteur suivi avec succès"));
    }

    @DeleteMapping({"/api/recommendations/authors/{authorId}", "/api/recommendations/authors/{authorId}/follow"})
    public ResponseEntity<ApiResponse<Void>> unfollowAuthor(
            @PathVariable Long authorId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        recommendationService.unfollowAuthor(userDetails.getId(), authorId);
        return ResponseEntity.ok(ApiResponse.ok("Désabonnement réussi"));
    }

    @GetMapping("/api/recommendations/authors")
    public ResponseEntity<List<Map<String, Object>>> getFollowedAuthors(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(recommendationService.getFollowedAuthors(userDetails.getId()));
    }

    // ==========================================
    // SUIVI DES THÈMES
    // ==========================================

    @PostMapping({"/api/recommendations/topics", "/api/recommendations/topics/follow"})
    public ResponseEntity<ApiResponse<Void>> followTopic(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String topic = (String) body.get("topic");
        Long domainId = body.get("domainId") != null ? Long.valueOf(body.get("domainId").toString()) : null;
        recommendationService.followTopic(userDetails.getId(), topic, domainId);
        return ResponseEntity.ok(ApiResponse.ok("Thème suivi avec succès"));
    }

    @DeleteMapping("/api/recommendations/topics/{topic}")
    public ResponseEntity<ApiResponse<Void>> unfollowTopic(
            @PathVariable String topic,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        recommendationService.unfollowTopic(userDetails.getId(), topic);
        return ResponseEntity.ok(ApiResponse.ok("Désabonnement du thème réussi"));
    }

    @GetMapping("/api/recommendations/topics")
    public ResponseEntity<List<Map<String, Object>>> getFollowedTopics(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(recommendationService.getFollowedTopics(userDetails.getId()));
    }

    // ==========================================
    // FAVORIS
    // ==========================================

    @GetMapping({"/api/recommendations/favorites", "/api/favorites"})
    public ResponseEntity<List<PublicationDTO>> getFavorites(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(recommendationService.getFavorites(userDetails.getId()));
    }

    @PostMapping({"/api/recommendations/favorites/{publicationId}", "/api/favorites/{publicationId}"})
    public ResponseEntity<ApiResponse<Void>> addFavorite(
            @PathVariable Long publicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        recommendationService.addFavorite(userDetails.getId(), publicationId);
        return ResponseEntity.ok(ApiResponse.ok("Publication ajoutée aux favoris"));
    }

    @DeleteMapping({"/api/recommendations/favorites/{publicationId}", "/api/favorites/{publicationId}"})
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @PathVariable Long publicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        recommendationService.removeFavorite(userDetails.getId(), publicationId);
        return ResponseEntity.ok(ApiResponse.ok("Publication retirée des favoris"));
    }

    @GetMapping({"/api/recommendations/favorites/{publicationId}/check", "/api/favorites/{publicationId}/check"})
    public ResponseEntity<Map<String, Boolean>> isFavorite(
            @PathVariable Long publicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean fav = userDetails != null && recommendationService.isFavorite(userDetails.getId(), publicationId);
        return ResponseEntity.ok(Map.of("isFavorite", fav));
    }

    // ==========================================
    // HISTORIQUE DE LECTURE
    // ==========================================

    @GetMapping("/api/recommendations/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(recommendationService.getReadingHistory(userDetails.getId()));
    }

    @PostMapping("/api/recommendations/history")
    public ResponseEntity<ApiResponse<Void>> trackReading(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long publicationId = Long.valueOf(body.get("publicationId").toString());
        Integer lastPage = body.get("lastPage") != null ? Integer.valueOf(body.get("lastPage").toString()) : null;
        Float progress = body.get("progress") != null ? Float.valueOf(body.get("progress").toString()) : null;
        Integer duration = body.get("durationSeconds") != null ? Integer.valueOf(body.get("durationSeconds").toString()) : null;

        recommendationService.recordReading(userDetails.getId(), publicationId, lastPage, progress, duration);
        return ResponseEntity.ok(ApiResponse.ok("Historique enregistré"));
    }
}
