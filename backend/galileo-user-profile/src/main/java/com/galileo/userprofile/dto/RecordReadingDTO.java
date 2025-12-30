package com.galileo.userprofile.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordReadingDTO {
    
    @NotNull(message = "L'ID de la publication est requis")
    private Long publicationId;
    
    private String publicationTitle;
    
    private String publicationDomain;
    
    @Min(value = 0, message = "La durée de lecture doit être positive")
    private Integer readingDurationSeconds;
    
    @Min(value = 0, message = "Le pourcentage de progression doit être entre 0 et 100")
    @Max(value = 100, message = "Le pourcentage de progression doit être entre 0 et 100")
    private Integer progressPercentage;
}

