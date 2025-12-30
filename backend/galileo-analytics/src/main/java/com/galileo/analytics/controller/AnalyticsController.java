package com.galileo.analytics.controller;

import com.galileo.analytics.dto.DashboardStatsDTO;
import com.galileo.analytics.dto.PageViewDTO;
import com.galileo.analytics.dto.PublicationAnalyticsDTO;
import com.galileo.analytics.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    /**
     * Enregistrer une vue de page
     */
    @PostMapping("/track/pageview")
    public ResponseEntity<Void> trackPageView(
            @RequestBody PageViewDTO pageViewDTO,
            HttpServletRequest request) {
        String ipAddress = getClientIp(request);
        analyticsService.trackPageView(pageViewDTO, ipAddress);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Enregistrer une vue de publication
     */
    @PostMapping("/track/publication/{publicationId}/view")
    public ResponseEntity<Void> trackPublicationView(
            @PathVariable Long publicationId,
            @RequestParam(required = false) String title) {
        analyticsService.incrementPublicationView(publicationId, title);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Enregistrer un téléchargement de publication
     */
    @PostMapping("/track/publication/{publicationId}/download")
    public ResponseEntity<Void> trackPublicationDownload(@PathVariable Long publicationId) {
        analyticsService.incrementPublicationDownload(publicationId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Récupérer les statistiques du dashboard admin
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(defaultValue = "30") int days) {
        log.info("Récupération des stats du dashboard pour les {} derniers jours", days);
        DashboardStatsDTO stats = analyticsService.getDashboardStats(days);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Récupérer les analytics d'une publication spécifique
     */
    @GetMapping("/publications/{publicationId}")
    public ResponseEntity<PublicationAnalyticsDTO> getPublicationAnalytics(
            @PathVariable Long publicationId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("Récupération des analytics pour la publication {} ({} jours)", publicationId, days);
        PublicationAnalyticsDTO analytics = analyticsService.getPublicationAnalytics(publicationId, days);
        return ResponseEntity.ok(analytics);
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}

