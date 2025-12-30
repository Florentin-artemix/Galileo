package com.galileo.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicationAnalyticsDTO {
    
    private Long publicationId;
    private String title;
    
    // Stats totales
    private Long totalViews;
    private Long totalDownloads;
    private Long totalFavorites;
    private Long avgReadingTimeSeconds;
    
    // Stats de la période
    private Long periodViews;
    private Long periodDownloads;
    
    // Historique
    private List<DailyMetricDTO> viewsHistory;
}

