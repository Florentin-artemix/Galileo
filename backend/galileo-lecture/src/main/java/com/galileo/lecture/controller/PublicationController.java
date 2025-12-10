package com.galileo.lecture.controller;

import com.galileo.lecture.dto.PublicationDTO;
import com.galileo.lecture.service.PublicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour les publications publiques
 * Routes accessibles sans authentification
 */
@Slf4j
@RestController
@RequestMapping("/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationService publicationService;

    /**
     * GET /publications
     * Lister toutes les publications avec pagination
     */
    @GetMapping
    public ResponseEntity<Page<PublicationDTO>> listerPublications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "datePublication") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        log.info("Récupération des publications - page: {}, size: {}", page, size);
        
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<PublicationDTO> publications = publicationService.obtenirToutesLesPublications(pageable);
        return ResponseEntity.ok(publications);
    }

    /**
     * GET /publications/{id}
     * Obtenir une publication par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PublicationDTO> obtenirPublication(@PathVariable Long id) {
        log.info("Récupération de la publication ID: {}", id);
        PublicationDTO publication = publicationService.obtenirPublicationParId(id);
        return ResponseEntity.ok(publication);
    }

    /**
     * GET /publications/domaine/{domaine}
     * Rechercher les publications par domaine
     */
    @GetMapping("/domaine/{domaine}")
    public ResponseEntity<List<PublicationDTO>> rechercherParDomaine(@PathVariable String domaine) {
        log.info("Recherche de publications par domaine: {}", domaine);
        List<PublicationDTO> publications = publicationService.rechercherParDomaine(domaine);
        return ResponseEntity.ok(publications);
    }

    /**
     * GET /publications/auteur/{auteur}
     * Rechercher les publications par auteur
     */
    @GetMapping("/auteur/{auteur}")
    public ResponseEntity<List<PublicationDTO>> rechercherParAuteur(@PathVariable String auteur) {
        log.info("Recherche de publications par auteur: {}", auteur);
        List<PublicationDTO> publications = publicationService.rechercherParAuteur(auteur);
        return ResponseEntity.ok(publications);
    }

    /**
     * GET /publications/recentes
     * Obtenir les 10 publications les plus récentes
     */
    @GetMapping("/recentes")
    public ResponseEntity<List<PublicationDTO>> obtenirPublicationsRecentes() {
        log.info("Récupération des publications récentes");
        List<PublicationDTO> publications = publicationService.obtenirPublicationsRecentes();
        return ResponseEntity.ok(publications);
    }

    /**
     * GET /publications/populaires
     * Obtenir les 10 publications les plus vues
     */
    @GetMapping("/populaires")
    public ResponseEntity<List<PublicationDTO>> obtenirPublicationsPopulaires() {
        log.info("Récupération des publications populaires");
        List<PublicationDTO> publications = publicationService.obtenirPublicationsPopulaires();
        return ResponseEntity.ok(publications);
    }

    /**
     * POST /publications/{id}/telechargement
     * Enregistrer un téléchargement
     */
    @PostMapping("/{id}/telechargement")
    public ResponseEntity<Void> enregistrerTelechargement(@PathVariable Long id) {
        log.info("Enregistrement du téléchargement pour la publication ID: {}", id);
        publicationService.enregistrerTelechargement(id);
        return ResponseEntity.ok().build();
    }
}
