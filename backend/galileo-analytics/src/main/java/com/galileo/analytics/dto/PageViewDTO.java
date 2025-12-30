package com.galileo.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageViewDTO {
    
    private String pagePath;
    private String pageTitle;
    private String userId;
    private String sessionId;
    private String referrer;
    private String userAgent;
    private Integer durationSeconds;
}

