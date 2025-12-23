package com.galileo.lecture.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleBlogCreateDTO {
    
    @NotBlank(message = "Le titre est requis")
    @Size(min = 10, max = 500, message = "Le titre doit contenir entre 10 et 500 caractères")
    private String titre;
    
    @NotBlank(message = "Le contenu est requis")
    @Size(min = 100, message = "Le contenu doit contenir au moins 100 caractères")
    private String contenu;
    
    @NotBlank(message = "Le résumé est requis")
    @Size(min = 50, max = 1000, message = "Le résumé doit contenir entre 50 et 1000 caractères")
    private String resume;
    
    @NotBlank(message = "L'auteur est requis")
    private String auteur;
    
    @Size(max = 500, message = "La catégorie ne peut pas dépasser 500 caractères")
    private String categorie;
    
    @Size(max = 500, message = "Les mots-clés ne peuvent pas dépasser 500 caractères")
    private String motsCles;
    
    @Size(max = 1000, message = "L'URL de l'image ne peut pas dépasser 1000 caractères")
    private String urlImagePrincipale;
    
    private Integer tempsLecture; // En minutes
    
    private Boolean publie = true; // Par défaut publié
}

