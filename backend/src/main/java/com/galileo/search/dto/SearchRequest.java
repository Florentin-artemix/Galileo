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
    private Long domainId;
    private Long institutionId;
    private String academicYear;
    private String type;
    private int page;
    private int size;
}
