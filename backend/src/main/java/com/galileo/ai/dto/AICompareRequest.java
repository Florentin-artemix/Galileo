package com.galileo.ai.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AICompareRequest {
    @NotEmpty(message = "Au moins deux publications sont requises pour une comparaison")
    private List<Long> publicationIds;
    private List<String> criteria;
}
