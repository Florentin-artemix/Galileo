package com.galileo.ecriture.service;

import com.galileo.ecriture.dto.SoumissionCreationDTO;
import com.galileo.ecriture.dto.SoumissionResponseDTO;
import com.galileo.ecriture.entity.Soumission;
import com.galileo.ecriture.entity.Soumission.StatutSoumission;
import com.galileo.ecriture.repository.SoumissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SoumissionService {

    private static final Logger logger = LoggerFactory.getLogger(SoumissionService.class);

    private final SoumissionRepository soumissionRepository;
    private final CloudflareR2Service cloudflareR2Service;
    private final EmailService emailService;

    public SoumissionService(SoumissionRepository soumissionRepository,
                            CloudflareR2Service cloudflareR2Service,
                            EmailService emailService) {
        this.soumissionRepository = soumissionRepository;
        this.cloudflareR2Service = cloudflareR2Service;
        this.emailService = emailService;
    }

    /**
     * Créer une nouvelle soumission avec upload du PDF
     */
    public SoumissionResponseDTO creerSoumission(SoumissionCreationDTO dto, 
                                                 MultipartFile fichierPdf,
                                                 String userId,
                                                 String userEmail) throws IOException {
        // Validation du fichier PDF
        validerFichierPdf(fichierPdf);

        // Upload du fichier vers R2
        String r2Key = cloudflareR2Service.uploadFile(fichierPdf, "soumissions/pdf/");
        
        // Créer l'entité Soumission
        Soumission soumission = new Soumission();
        soumission.setTitre(dto.getTitre());
        soumission.setResume(dto.getResume());
        soumission.setAuteurPrincipal(dto.getAuteurPrincipal());
        soumission.setEmailAuteur(dto.getEmailAuteur());
        soumission.setCoAuteurs(dto.getCoAuteurs());
        soumission.setMotsCles(dto.getMotsCles());
        soumission.setDomaineRecherche(dto.getDomaineRecherche());
        soumission.setNotes(dto.getNotes());
        soumission.setStatut(StatutSoumission.EN_ATTENTE);
        soumission.setDateSoumission(LocalDateTime.now());
        soumission.setR2KeyPdf(r2Key);
        soumission.setUserId(userId);
        soumission.setUserEmail(userEmail);

        // Générer URL signée (valide 30 jours pour les admins)
        String urlSignee = cloudflareR2Service.genererUrlSignee(r2Key, 43200); // 30 jours
        soumission.setUrlPdf(urlSignee);

        // Sauvegarder
        Soumission saved = soumissionRepository.save(soumission);
        logger.info("Soumission créée: {} par {}", saved.getId(), userEmail);

        // Envoyer notification à l'auteur
        emailService.envoyerConfirmationSoumission(saved);

        return convertirEnDTO(saved);
    }

    /**
     * Lister toutes les soumissions d'un utilisateur
     */
    @Transactional(readOnly = true)
    public List<SoumissionResponseDTO> listerSoumissionsUtilisateur(String userId) {
        List<Soumission> soumissions = soumissionRepository.findByUserIdOrderByDateSoumissionDesc(userId);
        return soumissions.stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtenir une soumission par ID (vérifier que l'utilisateur est propriétaire)
     */
    @Transactional(readOnly = true)
    public SoumissionResponseDTO obtenirSoumission(Long id, String userId) {
        Soumission soumission = soumissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));

        // Vérifier que l'utilisateur est propriétaire
        if (!soumission.getUserId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé à cette soumission");
        }

        return convertirEnDTO(soumission);
    }

    /**
     * Retirer une soumission (seulement si EN_ATTENTE ou EN_REVISION)
     */
    public void retirerSoumission(Long id, String userId) {
        Soumission soumission = soumissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));

        // Vérifier propriétaire
        if (!soumission.getUserId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé à cette soumission");
        }

        // Vérifier statut
        if (soumission.getStatut() != StatutSoumission.EN_ATTENTE && 
            soumission.getStatut() != StatutSoumission.EN_REVISION) {
            throw new RuntimeException("Impossible de retirer une soumission déjà traitée");
        }

        soumission.setStatut(StatutSoumission.RETIREE);
        soumissionRepository.save(soumission);

        logger.info("Soumission {} retirée par {}", id, userId);
    }

    /**
     * Validation du fichier PDF
     */
    private void validerFichierPdf(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Le fichier PDF est obligatoire");
        }

        // Vérifier le type MIME
        String contentType = fichier.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Seuls les fichiers PDF sont acceptés");
        }

        // Vérifier la taille (max 50MB)
        long maxSize = 50 * 1024 * 1024; // 50MB en bytes
        if (fichier.getSize() > maxSize) {
            throw new IllegalArgumentException("Le fichier ne doit pas dépasser 50MB");
        }

        // Vérifier l'extension du nom de fichier
        String filename = fichier.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("L'extension du fichier doit être .pdf");
        }
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
