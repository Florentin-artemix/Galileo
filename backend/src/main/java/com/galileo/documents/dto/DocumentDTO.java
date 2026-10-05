package com.galileo.documents.dto;

import com.galileo.documents.entity.DocumentProcessingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {
    private Long id;
    private Long publicationId;
    private String fileName;
    private String fileKey;
    private Long fileSize;
    private String mimeType;
    private Integer pageCount;
    private DocumentProcessingStatus processingStatus;
    private String processingError;
    private Integer version;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
