package com.galileo.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AISummaryResponse {
    private Long publicationId;
    private String summaryType;
    private String content;
    private boolean cached;
    private String model;

    @com.fasterxml.jackson.annotation.JsonProperty("fromCache")
    public boolean isFromCache() {
        return cached;
    }
    @Builder.Default
    private String disclaimer = "Synthèse générée par IA (Claude). Destinée à l'apprentissage et à la veille académique.";
}
