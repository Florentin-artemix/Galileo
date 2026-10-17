package com.galileo.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchRequest {
    private String query;
    private String q;
    private String title;
    private String author;
    private String domain;
    private Long domainId;
    private String institution;
    private Long institutionId;
    private String academicYear;
    private String type;
    private String language;
    private List<String> keywords;
    private int page;
    private int size;
    private String sortBy;
    private String direction;

    public String getEffectiveQuery() {
        if (query != null && !query.trim().isEmpty()) return query.trim();
        if (q != null && !q.trim().isEmpty()) return q.trim();
        return null;
    }
}
