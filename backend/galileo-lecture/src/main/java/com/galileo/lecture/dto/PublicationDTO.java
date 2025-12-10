package com.galileo.lecture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour l'affichage public d'une publication
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicationDTO {

    private Long id;
    private String titre;
    private String resume;
    private String auteurPrincipal;
    private String coAuteurs;
    private String domaine;
    private String motsCles;
    private String urlPdf;
    private String urlImageCouverture;
    private Long tailleFichier;
    private Integer nombrePages;
    private Integer nombreVues;
    private Integer nombreTelechargements;
    private LocalDateTime datePublication;
}
