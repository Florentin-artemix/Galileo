package com.galileo.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopPublicationDTO {
    
    private Long publicationId;
    private String title;
    private String domain;
    private Long viewsCount;
    private Long downloadsCount;
    private Long favoritesCount;
}

