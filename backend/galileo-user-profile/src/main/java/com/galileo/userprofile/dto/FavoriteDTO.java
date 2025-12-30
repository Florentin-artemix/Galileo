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
public class FavoriteDTO {
    
    private Long id;
    private Long publicationId;
    private String publicationTitle;
    private String publicationDomain;
    private LocalDateTime createdAt;
}

