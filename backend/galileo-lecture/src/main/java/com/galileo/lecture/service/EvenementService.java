package com.galileo.lecture.service;

import com.galileo.lecture.dto.EvenementDTO;
import com.galileo.lecture.entity.Evenement;
import com.galileo.lecture.repository.EvenementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvenementService {

    private final EvenementRepository evenementRepository;

    public List<EvenementDTO> obtenirTousLesEvenements() {
        return evenementRepository.findByPublieTrue()
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    public EvenementDTO obtenirEvenementParId(Long id) {
        Evenement evenement = evenementRepository.findById(id)
                .filter(Evenement::getPublie)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));
        return convertirEnDTO(evenement);
    }

    public List<EvenementDTO> obtenirEvenementsAVenir() {
        return evenementRepository.findEvenementsAVenir(LocalDateTime.now())
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    public List<EvenementDTO> obtenirEvenementsPasses() {
        return evenementRepository.findEvenementsPasses(LocalDateTime.now())
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    public List<EvenementDTO> obtenirEvenementsParType(String type) {
        return evenementRepository.findByTypeAndPublieTrue(type)
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    private EvenementDTO convertirEnDTO(Evenement evenement) {
        return EvenementDTO.builder()
                .id(evenement.getId())
                .titre(evenement.getTitre())
                .description(evenement.getDescription())
                .type(evenement.getType())
                .organisateur(evenement.getOrganisateur())
                .dateDebut(evenement.getDateDebut())
                .dateFin(evenement.getDateFin())
                .lieu(evenement.getLieu())
                .lieuVirtuel(evenement.getLieuVirtuel())
                .urlInscription(evenement.getUrlInscription())
                .urlImage(evenement.getUrlImage())
                .nombreParticipantsMax(evenement.getNombreParticipantsMax())
                .nombreInscrits(evenement.getNombreInscrits())
                .motsCles(evenement.getMotsCles())
                .estPasse(evenement.estPasse())
                .estComplet(evenement.estComplet())
                .build();
    }
}
