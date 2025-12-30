package com.galileo.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyMetricDTO {
    
    private LocalDate date;
    private Long pageViews;
    private Long uniqueVisitors;
    private Long downloads;
    private Long newUsers;
}

