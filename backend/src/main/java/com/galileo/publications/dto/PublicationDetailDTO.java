package com.galileo.publications.dto;

import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.entity.PublicationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicationDetailDTO {
    private Long id;
    private String title;
    private String slug;
    private String abstractText;
    private PublicationType type;
    private PublicationStatus status;
    private AccessLevel accessLevel;
    private Long domainId;
    private String domainName;
    private Long institutionId;
    private String institutionName;
    private String language;
    private LocalDateTime publishedAt;
    private String academicYear;
    private String supervisor;
    private String methodology;
    private String doi;
    private String license;
    private String referencesText;
    private Integer viewCount;
    private Integer downloadCount;
    private List<String> authors;
    private List<String> keywords;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
