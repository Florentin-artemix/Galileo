package com.galileo.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    
    // Métriques globales
    private Long totalPageViews;
    private Long totalUniqueVisitors;
    private Long totalPublications;
    private Long totalDownloads;
    private Long totalSubmissions;
    private Long pendingSubmissions;
    
    // Métriques de la période (jour/semaine/mois)
    private Long periodPageViews;
    private Long periodUniqueVisitors;
    private Long periodDownloads;
    private Long periodNewUsers;
    
    // Pourcentages de changement
    private Double pageViewsChange;
    private Double visitorsChange;
    private Double downloadsChange;
    
    // Top publications
    private List<TopPublicationDTO> topPublications;
    
    // Distribution par appareil
    private Map<String, Long> deviceDistribution;
    
    // Distribution géographique
    private Map<String, Long> countryDistribution;
    
    // Historique pour graphiques
    private List<DailyMetricDTO> dailyMetrics;
}

