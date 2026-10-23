package com.galileo.ai.dto;

import com.galileo.ai.entity.AIMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    private Long conversationId;
    private Long messageId;
    private String reply;
    private AIMode mode;
    private List<SourceCitation> sources;
    @Builder.Default
    private String disclaimer = "Réponse générée par IA (Claude). Les résultats doivent faire l'objet d'une vérification critique.";

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceCitation {
        private Long chunkId;
        private Integer pageStart;
        private Integer pageEnd;
        private String excerpt;
        private Double similarity;
    }
}
