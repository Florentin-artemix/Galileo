package com.galileo.lecture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleBlogDTO {
    private Long id;
    private String titre;
    private String contenu;
    private String resume;
    private String auteur;
    private String categorie;
    private String motsCles;
    private String urlImagePrincipale;
    private Integer tempsLecture;
    private Integer nombreVues;
    private LocalDateTime datePublication;
}
