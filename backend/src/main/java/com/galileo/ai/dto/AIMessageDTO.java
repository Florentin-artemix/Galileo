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
public class AIMessageDTO {
    private Long id;
    private Long conversationId;
    private String role;
    private String content;
    private String metadata;
    private LocalDateTime createdAt;
}
