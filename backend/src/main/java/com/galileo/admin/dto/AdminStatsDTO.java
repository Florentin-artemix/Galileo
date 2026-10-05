package com.galileo.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    private long totalUsers;
    private long totalPublications;
    private long totalSubmissions;
    private long pendingSubmissions;
    private long totalDocuments;
    private long totalAIInteractions;
}
