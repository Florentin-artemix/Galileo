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
    @jakarta.validation.constraints.Size(max = 10000, message = "Le passage ne peut dépasser 10000 caractères")
    private String passage;
    @Builder.Default
    private String level = "INTERMEDIAIRE"; // SIMPLIFIE, INTERMEDIAIRE, AVANCE
    private Long publicationId;
}
