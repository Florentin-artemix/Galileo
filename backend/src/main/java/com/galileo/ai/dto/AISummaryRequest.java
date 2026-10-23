package com.galileo.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AISummaryRequest {
    @NotNull(message = "L'ID de publication est obligatoire")
    private Long publicationId;
    @Builder.Default
    private String summaryType = "RAPIDE"; // RAPIDE, STRUCTURE, PEDAGOGIQUE
}
