package com.galileo.lecture.service;

import com.galileo.lecture.dto.PublicationDTO;
import com.galileo.lecture.dto.RecherchePublicationDTO;
import com.galileo.lecture.entity.Publication;
import com.galileo.lecture.repository.PublicationRepository;
import com.galileo.lecture.specification.PublicationSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
     * Recherche avancée avec filtres multiples
     */
    public Page<PublicationDTO> rechercheAvancee(RecherchePublicationDTO criteres) {
        Specification<Publication> spec = PublicationSpecification.estPubliee();
        
        // Appliquer les filtres
        if (criteres.getQuery() != null && !criteres.getQuery().isEmpty()) {
            spec = spec.and(PublicationSpecification.rechercheGlobale(criteres.getQuery()));
        }
        if (criteres.getDomaine() != null && !criteres.getDomaine().isEmpty()) {
            spec = spec.and(PublicationSpecification.parDomaine(criteres.getDomaine()));
        }
        if (criteres.getAuteur() != null && !criteres.getAuteur().isEmpty()) {
            spec = spec.and(PublicationSpecification.parAuteur(criteres.getAuteur()));
        }
        if (criteres.getMotsCles() != null && !criteres.getMotsCles().isEmpty()) {
            spec = spec.and(PublicationSpecification.parMotsCles(criteres.getMotsCles()));
        }
        if (criteres.getTitre() != null && !criteres.getTitre().isEmpty()) {
            spec = spec.and(PublicationSpecification.parTitre(criteres.getTitre()));
        }
        if (criteres.getMinVues() != null) {
            spec = spec.and(PublicationSpecification.minimumVues(criteres.getMinVues()));
        }
        
        // Pagination et tri
        Sort sort = Sort.by(Sort.Direction.fromString(criteres.getDirection()), criteres.getSortBy());
        Pageable pageable = PageRequest.of(criteres.getPage(), criteres.getSize(), sort);
        
        return publicationRepository.findAll(spec, pageable).map(this::convertirEnDTO);
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
