package com.galileo.publications.dto;

import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.PublicationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicationCreateDTO {

    @NotBlank(message = "Title is required")
    private String title;

    private String abstractText;

    @NotNull(message = "Publication type is required")
    private PublicationType type;

    private AccessLevel accessLevel;

    private Long domainId;

    private Long institutionId;

    private String language;

    private String academicYear;

    private String supervisor;

    private String methodology;

    private String doi;

    private String license;

    private String referencesText;

    private List<String> keywords;

    private List<String> authors;
}
