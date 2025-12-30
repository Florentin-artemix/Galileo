package com.galileo.userprofile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingHistoryDTO {
    
    private Long id;
    private Long publicationId;
    private String publicationTitle;
    private String publicationDomain;
    private LocalDateTime readAt;
    private Integer readingDurationSeconds;
    private Integer progressPercentage;
}

