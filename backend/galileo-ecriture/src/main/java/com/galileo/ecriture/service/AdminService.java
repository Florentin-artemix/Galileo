package com.galileo.ecriture.service;

import com.galileo.ecriture.client.PublicationFeignClient;
import com.galileo.ecriture.dto.SoumissionResponseDTO;
import com.galileo.ecriture.entity.Soumission;
import com.galileo.ecriture.entity.Soumission.StatutSoumission;
import com.galileo.ecriture.repository.SoumissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final SoumissionRepository soumissionRepository;
    private final EmailService emailService;
    private final PublicationFeignClient publicationFeignClient;

    public AdminService(SoumissionRepository soumissionRepository,
                       EmailService emailService,
                       PublicationFeignClient publicationFeignClient) {
        this.soumissionRepository = soumissionRepository;
        this.emailService = emailService;
        this.publicationFeignClient = publicationFeignClient;
    }

    /**
     * Lister toutes les soumissions en attente
     */
    @Transactional(readOnly = true)
    public List<SoumissionResponseDTO> listerSoumissionsEnAttente() {
        List<Soumission> soumissions = soumissionRepository.findByStatut(StatutSoumission.EN_ATTENTE);
        return soumissions.stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lister toutes les soumissions par statut
     */
    @Transactional(readOnly = true)
    public List<SoumissionResponseDTO> listerSoumissionsParStatut(StatutSoumission statut) {
        List<Soumission> soumissions = soumissionRepository.findByStatut(statut);
        return soumissions.stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtenir les statistiques des soumissions
     */
    @Transactional(readOnly = true)
    public Map<String, Long> obtenirStatistiques() {
        return Map.of(
                "EN_ATTENTE", soumissionRepository.countByStatut(StatutSoumission.EN_ATTENTE),
                "EN_REVISION", soumissionRepository.countByStatut(StatutSoumission.EN_REVISION),
                "VALIDEE", soumissionRepository.countByStatut(StatutSoumission.VALIDEE),
                "REJETEE", soumissionRepository.countByStatut(StatutSoumission.REJETEE),
                "RETIREE", soumissionRepository.countByStatut(StatutSoumission.RETIREE)
        );
    }

    /**
     * Valider une soumission et créer la publication correspondante
     */
    public SoumissionResponseDTO validerSoumission(Long soumissionId, 
                                                   String commentaire,
                                                   String adminEmail) {
        Soumission soumission = soumissionRepository.findById(soumissionId)
                .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));

        // Vérifier que la soumission est en attente ou en révision
        if (soumission.getStatut() != StatutSoumission.EN_ATTENTE && 
            soumission.getStatut() != StatutSoumission.EN_REVISION) {
            throw new RuntimeException("Cette soumission ne peut pas être validée (statut: " + 
                    soumission.getStatut() + ")");
        }

        try {
            // Créer la publication via Feign Client
            PublicationFeignClient.PublicationCreationRequest request = 
                    PublicationFeignClient.PublicationCreationRequest.fromSoumission(soumission);
            Long publicationId = publicationFeignClient.creerPublicationDepuisSoumission(request);

            // Mettre à jour la soumission
            soumission.setStatut(StatutSoumission.VALIDEE);
            soumission.setCommentaireAdmin(commentaire);
            soumission.setValideePar(adminEmail);
            soumission.setDateValidation(LocalDateTime.now());
            soumission.setPublicationId(publicationId);

            Soumission saved = soumissionRepository.save(soumission);
            logger.info("Soumission {} validée par {} -> Publication {}", 
                    soumissionId, adminEmail, publicationId);

            // Envoyer notification à l'auteur
            emailService.notifierValidation(saved);

            return convertirEnDTO(saved);

        } catch (Exception e) {
            logger.error("Erreur lors de la création de la publication pour soumission {}", 
                    soumissionId, e);
            throw new RuntimeException("Erreur lors de la validation: " + e.getMessage(), e);
        }
    }

    /**
     * Rejeter une soumission
     */
    public SoumissionResponseDTO rejeterSoumission(Long soumissionId, 
                                                   String commentaire,
                                                   String adminEmail) {
        Soumission soumission = soumissionRepository.findById(soumissionId)
                .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));

        // Vérifier que la soumission est en attente ou en révision
        if (soumission.getStatut() != StatutSoumission.EN_ATTENTE && 
            soumission.getStatut() != StatutSoumission.EN_REVISION) {
            throw new RuntimeException("Cette soumission ne peut pas être rejetée (statut: " + 
                    soumission.getStatut() + ")");
        }

        soumission.setStatut(StatutSoumission.REJETEE);
        soumission.setCommentaireAdmin(commentaire);
        soumission.setValideePar(adminEmail);
        soumission.setDateValidation(LocalDateTime.now());

        Soumission saved = soumissionRepository.save(soumission);
        logger.info("Soumission {} rejetée par {}", soumissionId, adminEmail);

        // Envoyer notification à l'auteur
        emailService.notifierRejet(saved);

        return convertirEnDTO(saved);
    }

    /**
     * Demander des révisions pour une soumission
     */
    public SoumissionResponseDTO demanderRevisions(Long soumissionId, 
                                                   String commentaire,
                                                   String adminEmail) {
        Soumission soumission = soumissionRepository.findById(soumissionId)
                .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));

        // Vérifier que la soumission est en attente
        if (soumission.getStatut() != StatutSoumission.EN_ATTENTE) {
            throw new RuntimeException("Cette soumission ne peut pas être mise en révision (statut: " + 
                    soumission.getStatut() + ")");
        }

        soumission.setStatut(StatutSoumission.EN_REVISION);
        soumission.setCommentaireAdmin(commentaire);
        soumission.setValideePar(adminEmail);

        Soumission saved = soumissionRepository.save(soumission);
        logger.info("Révisions demandées pour soumission {} par {}", soumissionId, adminEmail);

        // Envoyer notification à l'auteur
        emailService.notifierRevision(saved);

        return convertirEnDTO(saved);
    }

    /**
     * Convertir une entité Soumission en DTO
     */
    private SoumissionResponseDTO convertirEnDTO(Soumission soumission) {
        SoumissionResponseDTO dto = new SoumissionResponseDTO();
        dto.setId(soumission.getId());
        dto.setTitre(soumission.getTitre());
        dto.setResume(soumission.getResume());
        dto.setAuteurPrincipal(soumission.getAuteurPrincipal());
        dto.setEmailAuteur(soumission.getEmailAuteur());
        dto.setCoAuteurs(soumission.getCoAuteurs());
        dto.setMotsCles(soumission.getMotsCles());
        dto.setDomaineRecherche(soumission.getDomaineRecherche());
        dto.setStatut(soumission.getStatut());
        dto.setDateSoumission(soumission.getDateSoumission());
        dto.setUrlPdf(soumission.getUrlPdf());
        dto.setNotes(soumission.getNotes());
        dto.setCommentaireAdmin(soumission.getCommentaireAdmin());
        dto.setValideePar(soumission.getValideePar());
        dto.setDateValidation(soumission.getDateValidation());
        dto.setPublicationId(soumission.getPublicationId());
        return dto;
    }
}
