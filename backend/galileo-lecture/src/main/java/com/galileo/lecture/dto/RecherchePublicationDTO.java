package com.galileo.lecture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour les critères de recherche avancée
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecherchePublicationDTO {
    
    private String query; // Recherche globale
    private String domaine;
    private String auteur;
    private String motsCles;
    private String titre;
    private Integer minVues;
    
    // Pagination
    @Builder.Default
    private Integer page = 0;
    
    @Builder.Default
    private Integer size = 20;
    
    @Builder.Default
    private String sortBy = "datePublication";
    
    @Builder.Default
    private String direction = "DESC";
}
