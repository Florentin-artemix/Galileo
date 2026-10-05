package com.galileo.documents.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadDTO {

    @NotNull(message = "Publication ID is required")
    private Long publicationId;

    private String fileName;

    private Long fileSize;

    private String mimeType;
}
