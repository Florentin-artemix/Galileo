package com.galileo.analytics.service;

import com.galileo.analytics.dto.*;
import com.galileo.analytics.entity.DailyStats;
import com.galileo.analytics.entity.PageView;
import com.galileo.analytics.entity.PublicationStats;
import com.galileo.analytics.repository.DailyStatsRepository;
import com.galileo.analytics.repository.PageViewRepository;
import com.galileo.analytics.repository.PublicationStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {
    
    private final PageViewRepository pageViewRepository;
    private final PublicationStatsRepository publicationStatsRepository;
    private final DailyStatsRepository dailyStatsRepository;
    
    @Transactional
    public void trackPageView(PageViewDTO pageViewDTO, String ipAddress) {
        PageView pageView = PageView.builder()
                .pagePath(pageViewDTO.getPagePath())
                .pageTitle(pageViewDTO.getPageTitle())
                .userId(pageViewDTO.getUserId())
                .sessionId(pageViewDTO.getSessionId())
                .referrer(pageViewDTO.getReferrer())
                .userAgent(pageViewDTO.getUserAgent())
                .ipAddress(ipAddress)
                .deviceType(detectDeviceType(pageViewDTO.getUserAgent()))
                .durationSeconds(pageViewDTO.getDurationSeconds())
                .build();
        
        pageViewRepository.save(pageView);
        log.debug("Page view tracked: {}", pageViewDTO.getPagePath());
    }
    
    public DashboardStatsDTO getDashboardStats(int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        LocalDateTime since = startDate.atStartOfDay();
        
        // Métriques de la période
        long periodPageViews = pageViewRepository.countViewsSince(since);
        long periodUniqueVisitors = pageViewRepository.countUniqueVisitorsSince(since);
        
        // Top pages/publications
        List<Object[]> topPages = pageViewRepository.findTopPagesSince(since);
        List<TopPublicationDTO> topPublications = extractTopPublications(topPages);
        
        // Distribution par appareil
        Map<String, Long> deviceDistribution = new HashMap<>();
        pageViewRepository.findViewsByDeviceTypeSince(since).forEach(row -> 
            deviceDistribution.put((String) row[0], (Long) row[1]));
        
        // Distribution géographique
        Map<String, Long> countryDistribution = new HashMap<>();
        pageViewRepository.findViewsByCountrySince(since).forEach(row -> 
            countryDistribution.put((String) row[0], (Long) row[1]));
        
        // Historique journalier
        List<DailyStats> dailyStats = dailyStatsRepository.findByStatDateBetweenOrderByStatDateAsc(startDate, endDate);
        List<DailyMetricDTO> dailyMetrics = dailyStats.stream()
                .map(this::toDailyMetricDTO)
                .collect(Collectors.toList());
        
        // Calcul des changements par rapport à la période précédente
        LocalDateTime previousPeriodStart = startDate.minusDays(days).atStartOfDay();
        LocalDateTime previousPeriodEnd = since;
        long previousPeriodViews = pageViewRepository.countViewsSince(previousPeriodStart);
        
        double pageViewsChange = calculatePercentageChange(previousPeriodViews, periodPageViews);
        
        return DashboardStatsDTO.builder()
                .periodPageViews(periodPageViews)
                .periodUniqueVisitors(periodUniqueVisitors)
                .pageViewsChange(pageViewsChange)
                .topPublications(topPublications)
                .deviceDistribution(deviceDistribution)
                .countryDistribution(countryDistribution)
                .dailyMetrics(dailyMetrics)
                .build();
    }
    
    public PublicationAnalyticsDTO getPublicationAnalytics(Long publicationId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        Long totalViews = publicationStatsRepository.getTotalViewsForPublication(publicationId);
        Long totalDownloads = publicationStatsRepository.getTotalDownloadsForPublication(publicationId);
        
        List<PublicationStats> stats = publicationStatsRepository.findByPublicationIdOrderByStatDateDesc(publicationId);
        
        // Calcul des stats de la période
        long periodViews = stats.stream()
                .filter(s -> !s.getStatDate().isBefore(startDate) && !s.getStatDate().isAfter(endDate))
                .mapToLong(s -> s.getViewsCount() != null ? s.getViewsCount() : 0)
                .sum();
        
        long periodDownloads = stats.stream()
                .filter(s -> !s.getStatDate().isBefore(startDate) && !s.getStatDate().isAfter(endDate))
                .mapToLong(s -> s.getDownloadsCount() != null ? s.getDownloadsCount() : 0)
                .sum();
        
        // Historique
        List<DailyMetricDTO> viewsHistory = stats.stream()
                .filter(s -> !s.getStatDate().isBefore(startDate) && !s.getStatDate().isAfter(endDate))
                .map(s -> DailyMetricDTO.builder()
                        .date(s.getStatDate())
                        .pageViews(s.getViewsCount())
                        .downloads(s.getDownloadsCount())
                        .build())
                .collect(Collectors.toList());
        
        String title = stats.isEmpty() ? null : stats.get(0).getPublicationTitle();
        
        return PublicationAnalyticsDTO.builder()
                .publicationId(publicationId)
                .title(title)
                .totalViews(totalViews != null ? totalViews : 0L)
                .totalDownloads(totalDownloads != null ? totalDownloads : 0L)
                .periodViews(periodViews)
                .periodDownloads(periodDownloads)
                .viewsHistory(viewsHistory)
                .build();
    }
    
    @Transactional
    public void incrementPublicationView(Long publicationId, String publicationTitle) {
        LocalDate today = LocalDate.now();
        
        PublicationStats stats = publicationStatsRepository
                .findByPublicationIdAndStatDate(publicationId, today)
                .orElseGet(() -> PublicationStats.builder()
                        .publicationId(publicationId)
                        .publicationTitle(publicationTitle)
                        .statDate(today)
                        .viewsCount(0L)
                        .build());
        
        stats.setViewsCount(stats.getViewsCount() + 1);
        publicationStatsRepository.save(stats);
    }
    
    @Transactional
    public void incrementPublicationDownload(Long publicationId) {
        LocalDate today = LocalDate.now();
        
        PublicationStats stats = publicationStatsRepository
                .findByPublicationIdAndStatDate(publicationId, today)
                .orElseGet(() -> PublicationStats.builder()
                        .publicationId(publicationId)
                        .statDate(today)
                        .downloadsCount(0L)
                        .build());
        
        stats.setDownloadsCount((stats.getDownloadsCount() != null ? stats.getDownloadsCount() : 0) + 1);
        publicationStatsRepository.save(stats);
    }
    
    private String detectDeviceType(String userAgent) {
        if (userAgent == null) return "unknown";
        userAgent = userAgent.toLowerCase();
        
        if (userAgent.contains("mobile") || userAgent.contains("android") || userAgent.contains("iphone")) {
            return "mobile";
        } else if (userAgent.contains("tablet") || userAgent.contains("ipad")) {
            return "tablet";
        }
        return "desktop";
    }
    
    private List<TopPublicationDTO> extractTopPublications(List<Object[]> topPages) {
        return topPages.stream()
                .filter(row -> ((String) row[0]).startsWith("/publication/"))
                .limit(10)
                .map(row -> TopPublicationDTO.builder()
                        .publicationId(extractPublicationId((String) row[0]))
                        .viewsCount((Long) row[1])
                        .build())
                .collect(Collectors.toList());
    }
    
    private Long extractPublicationId(String path) {
        try {
            String[] parts = path.split("/");
            return Long.parseLong(parts[parts.length - 1]);
        } catch (Exception e) {
            return null;
        }
    }
    
    private double calculatePercentageChange(long previous, long current) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        return ((double) (current - previous) / previous) * 100;
    }
    
    private DailyMetricDTO toDailyMetricDTO(DailyStats stats) {
        return DailyMetricDTO.builder()
                .date(stats.getStatDate())
                .pageViews(stats.getTotalPageViews())
                .uniqueVisitors(stats.getUniqueVisitors())
                .downloads(stats.getTotalDownloads())
                .newUsers(stats.getNewUsers())
                .build();
    }
}

