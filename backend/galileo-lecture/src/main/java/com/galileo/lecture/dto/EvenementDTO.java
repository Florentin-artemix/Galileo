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
public class EvenementDTO {
    private Long id;
    private String titre;
    private String description;
    private String type;
    private String organisateur;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String lieu;
    private String lieuVirtuel;
    private String urlInscription;
    private String urlImage;
    private Integer nombreParticipantsMax;
    private Integer nombreInscrits;
    private String motsCles;
    private Boolean estPasse;
    private Boolean estComplet;
}
