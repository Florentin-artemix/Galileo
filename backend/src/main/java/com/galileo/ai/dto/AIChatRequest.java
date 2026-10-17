package com.galileo.ai.dto;

import com.galileo.ai.entity.AIMode;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {
    private Long conversationId;
    private Long publicationId;
    private AIMode mode;
    @NotBlank(message = "Le message est obligatoire")
    private String message;
}
