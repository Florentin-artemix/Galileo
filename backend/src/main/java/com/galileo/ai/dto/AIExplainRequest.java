package com.galileo.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIExplainRequest {
    @NotBlank(message = "Le passage à expliquer est obligatoire")
    private String passage;
    @Builder.Default
    private String level = "INTERMEDIAIRE"; // SIMPLIFIE, INTERMEDIAIRE, AVANCE
    private Long publicationId;
}
