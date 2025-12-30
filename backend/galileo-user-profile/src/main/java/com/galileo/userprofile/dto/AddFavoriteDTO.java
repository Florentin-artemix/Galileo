package com.galileo.userprofile.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddFavoriteDTO {
    
    @NotNull(message = "L'ID de la publication est requis")
    private Long publicationId;
    
    private String publicationTitle;
    
    private String publicationDomain;
}

