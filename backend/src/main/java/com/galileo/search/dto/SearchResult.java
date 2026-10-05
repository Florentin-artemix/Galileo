package com.galileo.search.dto;

import com.galileo.publications.dto.PublicationDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResult {
    private List<PublicationDTO> publications;
    private long totalHits;
    private int page;
    private int totalPages;
}
