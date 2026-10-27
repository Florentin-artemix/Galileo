package com.galileo.ai.dto;

import com.galileo.ai.entity.AIMode;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {
    private Long conversationId;
    private Long publicationId;
    private AIMode mode;
    @NotBlank(message = "Le message est obligatoire")
    @jakarta.validation.constraints.Size(max = 4000, message = "Le message ne peut dépasser 4000 caractères")
    private String message;
}
