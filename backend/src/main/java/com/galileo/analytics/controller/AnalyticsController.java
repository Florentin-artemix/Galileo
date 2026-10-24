package com.galileo.analytics.controller;

import com.galileo.analytics.entity.AnalyticsEvent;
import com.galileo.analytics.repository.AnalyticsEventRepository;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.UnauthorizedException;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.PublicationAuthorRepository;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.recommendations.repository.FavoriteRepository;
import com.galileo.recommendations.repository.ReadingHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsEventRepository eventRepository;
    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final UserRepository userRepository;
    private final FavoriteRepository favoriteRepository;
    private final ReadingHistoryRepository readingHistoryRepository;

    @PostMapping("/track/pageview")
    public ResponseEntity<Void> trackPageView(@RequestBody(required = false) Map<String, Object> body) {
        log.debug("Tracked pageview: {}", body);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/publication/{id}/view")
    public ResponseEntity<Void> trackPublicationView(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        publicationRepository.findById(id).ifPresent(pub -> {
            pub.setViewCount((pub.getViewCount() != null ? pub.getViewCount() : 0) + 1);
            publicationRepository.save(pub);

            try {
                User user = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
                eventRepository.save(AnalyticsEvent.builder()
                        .eventType("PUBLICATION_VIEW")
                        .publication(pub)
                        .user(user)
                        .build());
            } catch (Exception e) {
                log.warn("Impossible d'enregistrer l'événement analytique de vue pour publication #{}: {}", id, e.getMessage());
            }
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/publication/{id}/download")
    public ResponseEntity<Void> trackPublicationDownload(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        publicationRepository.findById(id).ifPresent(pub -> {
            pub.setDownloadCount((pub.getDownloadCount() != null ? pub.getDownloadCount() : 0) + 1);
            publicationRepository.save(pub);

            try {
                User user = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
                eventRepository.save(AnalyticsEvent.builder()
                        .eventType("PUBLICATION_DOWNLOAD")
                        .publication(pub)
                        .user(user)
                        .build());
            } catch (Exception e) {
                log.warn("Impossible d'enregistrer l'événement analytique de téléchargement pour publication #{}: {}", id, e.getMessage());
            }
        });
        return ResponseEntity.ok().build();
    }

    @GetMapping("/global")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Map<String, Object>> getGlobalStats() {
        long totalPubs = publicationRepository.count();
        long totalUsers = userRepository.count();
        long totalFavs = favoriteRepository.count();
        long totalReads = readingHistoryRepository.count();
        long totalViews = publicationRepository.sumTotalViews();
        long totalDownloads = publicationRepository.sumTotalDownloads();

        Map<String, Object> map = new HashMap<>();
        map.put("totalPublications", totalPubs);
        map.put("totalUsers", totalUsers);
        map.put("totalFavorites", totalFavs);
        map.put("totalReads", Math.max(totalReads, totalViews));
        map.put("totalDownloads", totalDownloads);
        return ResponseEntity.ok(map);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserStats(
            @PathVariable String userId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Long uid = parseLongSafely(userId);
        if (uid == null) {
            return ResponseEntity.badRequest().build();
        }

        // Contrôle d'accès strict : l'utilisateur ne peut consulter que ses propres statistiques, sauf STAFF / ADMIN
        if (currentUser == null || (!currentUser.getId().equals(uid) && currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.STAFF)) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à consulter les statistiques d'un autre utilisateur");
        }

        long favs = favoriteRepository.countByUserId(uid);
        long reads = readingHistoryRepository.countByUserId(uid);

        Map<String, Object> map = new HashMap<>();
        map.put("totalPublications", 0);
        map.put("totalFavorites", favs);
        map.put("totalReads", reads);
        map.put("totalDownloads", 0);
        return ResponseEntity.ok(map);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @AuthenticationPrincipal Object principal
    ) {
        // Accès strictement réservé au personnel éditorial et administratif (STAFF ou ADMIN)
        if (principal instanceof CustomUserDetails currentUser) {
            if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.STAFF) {
                throw new ForbiddenException("Accès réservé au personnel administratif et éditorial (STAFF ou ADMIN)");
            }
        } else if (principal == null) {
            throw new UnauthorizedException("Authentification requise");
        }

        long totalPubs = publicationRepository.count();
        long totalUsers = userRepository.count();
        long totalViews = publicationRepository.sumTotalViews();
        long totalDownloads = publicationRepository.sumTotalDownloads();

        // Calcul des métriques temporelles à partir des événements réels horodatés
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        long viewsToday = eventRepository.countByEventTypeAndCreatedAtAfter("PUBLICATION_VIEW", startOfDay);
        long downloadsToday = eventRepository.countByEventTypeAndCreatedAtAfter("PUBLICATION_DOWNLOAD", startOfDay);
        long viewsThisWeek = eventRepository.countByEventTypeAndCreatedAtAfter("PUBLICATION_VIEW", startOfWeek);
        long downloadsThisWeek = eventRepository.countByEventTypeAndCreatedAtAfter("PUBLICATION_DOWNLOAD", startOfWeek);
        long viewsThisMonth = eventRepository.countByEventTypeAndCreatedAtAfter("PUBLICATION_VIEW", startOfMonth);
        long downloadsThisMonth = eventRepository.countByEventTypeAndCreatedAtAfter("PUBLICATION_DOWNLOAD", startOfMonth);

        List<Publication> topList = publicationRepository.findTop5ByStatusOrderByViewCountDesc(PublicationStatus.PUBLISHED);
        List<Map<String, Object>> topPubs = topList.stream()
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("publicationId", p.getId());
                    m.put("title", p.getTitle());
                    m.put("domain", p.getDomain() != null ? p.getDomain().getName() : "");
                    m.put("views", p.getViewCount() != null ? p.getViewCount() : 0);
                    m.put("downloads", p.getDownloadCount() != null ? p.getDownloadCount() : 0);
                    return m;
                })
                .toList();

        // Évolution quotidienne réelle sur les 7 derniers jours
        List<Map<String, Object>> dailyMetrics = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            LocalDateTime dStart = d.atStartOfDay();
            LocalDateTime dEnd = d.plusDays(1).atStartOfDay();
            long dayViews = eventRepository.countByEventTypeAndCreatedAtBetween("PUBLICATION_VIEW", dStart, dEnd);
            long dayDownloads = eventRepository.countByEventTypeAndCreatedAtBetween("PUBLICATION_DOWNLOAD", dStart, dEnd);

            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("date", d.toString());
            dayMap.put("views", dayViews);
            dayMap.put("downloads", dayDownloads);
            dailyMetrics.add(dayMap);
        }

        Map<String, Object> map = new HashMap<>();
        map.put("totalPublications", totalPubs);
        map.put("totalUsers", totalUsers);
        map.put("totalViews", totalViews);
        map.put("totalDownloads", totalDownloads);
        map.put("viewsToday", viewsToday);
        map.put("downloadsToday", downloadsToday);
        map.put("viewsThisWeek", viewsThisWeek);
        map.put("downloadsThisWeek", downloadsThisWeek);
        map.put("viewsThisMonth", viewsThisMonth);
        map.put("downloadsThisMonth", downloadsThisMonth);
        map.put("topPublications", topPubs);
        map.put("dailyMetrics", dailyMetrics);

        return ResponseEntity.ok(map);
    }

    @GetMapping("/publications/{id}")
    public ResponseEntity<Map<String, Object>> getPublicationAnalytics(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Publication pub = publicationRepository.findById(id).orElse(null);
        if (pub == null) {
            return ResponseEntity.notFound().build();
        }

        // Si la publication n'est pas publique et approuvée, seuls les auteurs ou STAFF/ADMIN peuvent voir ses statistiques
        if (pub.getStatus() != PublicationStatus.PUBLISHED) {
            boolean isStaffOrAdmin = currentUser != null && (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF);
            boolean isAuthor = currentUser != null && authorRepository.existsByPublicationIdAndUserId(pub.getId(), currentUser.getId());
            if (!isStaffOrAdmin && !isAuthor) {
                throw new ForbiddenException("Accès non autorisé aux statistiques d'une publication non publiée");
            }
        }

        long totalViews = pub.getViewCount() != null ? pub.getViewCount() : 0;
        long totalDownloads = pub.getDownloadCount() != null ? pub.getDownloadCount() : 0;
        Long uniqueUsers = eventRepository.countDistinctUserIdByPublicationId(pub.getId());
        long uniqueViewers = uniqueUsers != null && uniqueUsers > 0 ? uniqueUsers : totalViews;

        // Évolution des vues réelles sur 7 jours
        List<Map<String, Object>> viewsByDay = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            LocalDateTime dStart = d.atStartOfDay();
            LocalDateTime dEnd = d.plusDays(1).atStartOfDay();
            long dayViews = eventRepository.countByPublicationIdAndEventTypeAndCreatedAtAfter(pub.getId(), "PUBLICATION_VIEW", dStart)
                    - eventRepository.countByPublicationIdAndEventTypeAndCreatedAtAfter(pub.getId(), "PUBLICATION_VIEW", dEnd);

            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("date", d.toString());
            dayMap.put("views", Math.max(0, dayViews));
            viewsByDay.add(dayMap);
        }

        Map<String, Object> map = new HashMap<>();
        map.put("publicationId", pub.getId());
        map.put("title", pub.getTitle());
        map.put("totalViews", totalViews);
        map.put("totalDownloads", totalDownloads);
        map.put("uniqueViewers", uniqueViewers);
        // Indication explicite de non-mesure plutôt qu'une fausse constante de lecture
        map.put("averageReadTime", null);
        map.put("averageReadTimeMeasured", false);
        map.put("viewsByDay", viewsByDay);

        return ResponseEntity.ok(map);
    }

    private Long parseLongSafely(String str) {
        try {
            return Long.parseLong(str);
        } catch (Exception e) {
            return null;
        }
    }
}
