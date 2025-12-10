package com.galileo.lecture.service;

import com.galileo.lecture.dto.PublicationDTO;
import com.galileo.lecture.entity.Publication;
import com.galileo.lecture.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de gestion des Publications (Lecture publique)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;

    /**
     * Récupérer toutes les publications publiées avec pagination
     */
    public Page<PublicationDTO> obtenirToutesLesPublications(Pageable pageable) {
        Specification<Publication> spec = (root, query, cb) -> cb.isTrue(root.get("publiee"));
        return publicationRepository.findAll(spec, pageable)
                .map(this::convertirEnDTO);
    }

    /**
     * Récupérer une publication par son ID
     */
    @Transactional
    public PublicationDTO obtenirPublicationParId(Long id) {
        Publication publication = publicationRepository.findById(id)
                .filter(Publication::getPubliee)
                .orElseThrow(() -> new RuntimeException("Publication non trouvée"));
        
        // Incrémenter le compteur de vues
        publicationRepository.incrementerVues(id);
        
        return convertirEnDTO(publication);
    }

    /**
     * Rechercher des publications par domaine
     */
    public List<PublicationDTO> rechercherParDomaine(String domaine) {
        return publicationRepository.findByDomaineAndPublieeTrue(domaine)
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Rechercher des publications par auteur
     */
    public List<PublicationDTO> rechercherParAuteur(String auteur) {
        return publicationRepository.findByAuteurPrincipalContainingIgnoreCaseAndPublieeTrue(auteur)
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtenir les publications les plus récentes
     */
    public List<PublicationDTO> obtenirPublicationsRecentes() {
        return publicationRepository.findTop10ByPublieeTrueOrderByDatePublicationDesc()
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtenir les publications les plus vues
     */
    public List<PublicationDTO> obtenirPublicationsPopulaires() {
        return publicationRepository.findTop10ByPublieeTrueOrderByNombreVuesDesc()
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Enregistrer le téléchargement d'une publication
     */
    @Transactional
    public void enregistrerTelechargement(Long id) {
        publicationRepository.incrementerTelechargements(id);
        log.info("Téléchargement enregistré pour la publication ID: {}", id);
    }

    /**
     * Créer une nouvelle publication (appelé par le service Écriture)
     */
    @Transactional
    public PublicationDTO creerPublication(Publication publication) {
        Publication saved = publicationRepository.save(publication);
        log.info("Nouvelle publication créée avec l'ID: {}", saved.getId());
        return convertirEnDTO(saved);
    }

    /**
     * Convertir une entité Publication en DTO
     */
    private PublicationDTO convertirEnDTO(Publication publication) {
        return PublicationDTO.builder()
                .id(publication.getId())
                .titre(publication.getTitre())
                .resume(publication.getResume())
                .auteurPrincipal(publication.getAuteurPrincipal())
                .coAuteurs(publication.getCoAuteurs())
                .domaine(publication.getDomaine())
                .motsCles(publication.getMotsCles())
                .urlPdf(publication.getUrlPdf())
                .urlImageCouverture(publication.getUrlImageCouverture())
                .tailleFichier(publication.getTailleFichier())
                .nombrePages(publication.getNombrePages())
                .nombreVues(publication.getNombreVues())
                .nombreTelechargements(publication.getNombreTelechargements())
                .datePublication(publication.getDatePublication())
                .build();
    }
}
