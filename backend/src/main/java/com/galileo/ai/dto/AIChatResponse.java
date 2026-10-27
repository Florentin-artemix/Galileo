package com.galileo.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.galileo.ai.entity.AIMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    private Long conversationId;
    private Long messageId;

    // Contrat frontend : "response"
    private String response;

    private AIMode mode;

    // Contrat frontend : "sourceReferences"
    @Builder.Default
    private List<SourceReference> sourceReferences = new ArrayList<>();

    // Consommation réelle de jetons
    private Integer inputTokens;
    private Integer outputTokens;

    @Builder.Default
    private String disclaimer = "Réponse générée par IA. Les résultats doivent faire l'objet d'une vérification critique.";

    // Rétrocompatibilité : getter pour "reply"
    @JsonProperty("reply")
    public String getReply() {
        return response;
    }

    // Rétrocompatibilité : setter pour "reply"
    public void setReply(String reply) {
        if (this.response == null) {
            this.response = reply;
        }
    }

    // Rétrocompatibilité : getter pour "sources"
    @JsonProperty("sources")
    public List<SourceReference> getSources() {
        return sourceReferences;
    }

    // Rétrocompatibilité : setter pour "sources"
    public void setSources(List<SourceReference> sources) {
        if (this.sourceReferences == null || this.sourceReferences.isEmpty()) {
            this.sourceReferences = sources;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceReference {
        private Long chunkId;
        private Long attachmentId;
        private Long attachmentChunkId;
        private String fileName;
        private Integer pageNumber;
        private Integer pageStart;
        private Integer pageEnd;
        private String excerpt;
        private Double similarity;
    }

    // Classe statique conservée pour compatibilité binaire/source
    public static class SourceCitation extends SourceReference {
        public SourceCitation() {
            super();
        }

        public SourceCitation(Long chunkId, Integer pageStart, Integer pageEnd, String excerpt, Double similarity) {
            super(chunkId, pageStart != null ? pageStart : 1, pageStart, pageEnd, excerpt, similarity);
        }
    }
}
