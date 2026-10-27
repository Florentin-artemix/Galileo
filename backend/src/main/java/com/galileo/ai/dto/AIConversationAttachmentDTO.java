package com.galileo.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIConversationAttachmentDTO {
    private Long id;
    private Long conversationId;
    private String fileName;
    private Integer pageCount;
    private Integer extractedCharacters;
    private LocalDateTime createdAt;
}
