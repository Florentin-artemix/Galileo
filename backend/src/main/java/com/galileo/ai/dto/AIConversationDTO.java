package com.galileo.ai.dto;

import com.galileo.ai.entity.AIMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIConversationDTO {
    private Long id;
    private Long userId;
    private Long publicationId;
    private String publicationTitle;
    private AIMode mode;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
