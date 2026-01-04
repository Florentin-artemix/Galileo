package com.galileo.ecriture.controller;

import com.galileo.ecriture.client.NotificationClient;
import com.galileo.ecriture.dto.FeedbackDTO;
import com.galileo.ecriture.dto.SoumissionResponseDTO;
import com.galileo.ecriture.entity.Feedback;
import com.galileo.ecriture.security.Role;
import com.galileo.ecriture.entity.Soumission;
import com.galileo.ecriture.repository.FeedbackRepository;
import com.galileo.ecriture.repository.SoumissionRepository;
import com.galileo.ecriture.security.Permission;
import com.galileo.ecriture.security.RoleGuard;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur pour le dashboard des modérateurs (STAFF role)
 * Permet de gérer la file de modération et d'ajouter des feedbacks
 */
@RestController
@RequestMapping("/staff/moderation")
@RequiredArgsConstructor
@Slf4j
public class StaffModerationController {

    private final SoumissionRepository soumissionRepository;
    private final FeedbackRepository feedbackRepository;
    private final RoleGuard roleGuard;
    private final NotificationClient notificationClient;

    /**
     * Récupère la file de modération (soumissions en attente)
     */
    @GetMapping("/queue")
    public ResponseEntity<List<SoumissionResponseDTO>> getModerationQueue(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        log.info("Récupération de la file de modération");
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.MODERATE);
        
        List<Soumission> soumissions = soumissionRepository.findByStatut(Soumission.StatutSoumission.EN_ATTENTE);
        
        return ResponseEntity.ok(soumissions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
    }

    /**
     * Alias pour /queue - Récupère les éléments en attente
     */
    @GetMapping("/pending")
    public ResponseEntity<List<SoumissionResponseDTO>> getPendingItems(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        return getModerationQueue(roleHeader);
    }

    /**
     * Récupère les statistiques de modération
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getModerationStats(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        log.info("Récupération des statistiques de modération");
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.VIEW_STATISTICS);
        
        List<Soumission> toutes = soumissionRepository.findAll();
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        
        long pendingCount = toutes.stream()
            .filter(s -> Soumission.StatutSoumission.EN_ATTENTE.equals(s.getStatut()))
            .count();
        
        long approvedToday = toutes.stream()
            .filter(s -> Soumission.StatutSoumission.VALIDEE.equals(s.getStatut()))
            .filter(s -> s.getDateValidation() != null && s.getDateValidation().isAfter(today))
            .count();
        
        long rejectedToday = toutes.stream()
            .filter(s -> Soumission.StatutSoumission.REJETEE.equals(s.getStatut()))
            .filter(s -> s.getDateValidation() != null && s.getDateValidation().isAfter(today))
            .count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingCount", pendingCount);
        stats.put("approvedToday", approvedToday);
        stats.put("rejectedToday", rejectedToday);
        stats.put("averageProcessingTime", 0); // TODO: calculer le temps moyen réel
        stats.put("total", toutes.size());
        stats.put("en_attente", pendingCount);
        stats.put("validee", toutes.stream().filter(s -> Soumission.StatutSoumission.VALIDEE.equals(s.getStatut())).count());
        stats.put("rejetee", toutes.stream().filter(s -> Soumission.StatutSoumission.REJETEE.equals(s.getStatut())).count());
        stats.put("en_revision", toutes.stream().filter(s -> Soumission.StatutSoumission.EN_REVISION.equals(s.getStatut())).count());
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Alias pour /stats (ancien endpoint)
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiquesModeration(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        return getModerationStats(roleHeader);
    }

    /**
     * Récupère toutes les soumissions avec filtres avancés
     */
    @GetMapping("/soumissions")
    public ResponseEntity<List<SoumissionResponseDTO>> getSoumissionsAvecFiltres(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String auteurEmail,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.VIEW_ALL);
        
        List<Soumission> soumissions;
        
        if (statut != null && !statut.isEmpty()) {
            try {
                Soumission.StatutSoumission statutEnum = Soumission.StatutSoumission.valueOf(statut.toUpperCase());
                soumissions = soumissionRepository.findByStatut(statutEnum);
            } catch (IllegalArgumentException e) {
                soumissions = soumissionRepository.findAll();
            }
        } else if (auteurEmail != null && !auteurEmail.isEmpty()) {
            soumissions = soumissionRepository.findByUserEmailOrderByDateSoumissionDesc(auteurEmail);
        } else {
            soumissions = soumissionRepository.findAll();
        }
        
        return ResponseEntity.ok(soumissions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
    }

    /**
     * Approuve une soumission
     */
    @PostMapping("/approuver/{id}")
    public ResponseEntity<SoumissionResponseDTO> approuverSoumission(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Name", required = false) String nom) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.APPROVE_SUBMISSION);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        soumission.setStatut(Soumission.StatutSoumission.VALIDEE);
        soumission.setDateValidation(LocalDateTime.now());
        soumission.setValideePar(email);
        soumissionRepository.save(soumission);
        
        // Créer un feedback d'approbation
        Feedback feedback = Feedback.builder()
            .soumission(soumission)
            .moderatorEmail(email)
            .moderatorName(nom)
            .commentaire(feedbackRequest.getCommentaire())
            .statut("APPROVED")
            .internal(feedbackRequest.isInternal())
            .build();
        
        feedbackRepository.save(feedback);
        
        // Envoyer une notification à l'auteur
        try {
            notificationClient.sendSubmissionApprovedNotification(
                soumission.getUserId(),
                soumission.getId(),
                soumission.getTitre()
            );
        } catch (Exception e) {
            log.warn("Erreur lors de l'envoi de la notification d'approbation: {}", e.getMessage());
        }
        
        log.info("Soumission {} approuvée par {}", id, email);
        
        return ResponseEntity.ok(convertToDTO(soumission));
    }

    /**
     * Alias pour approuver (nouveau endpoint)
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<SoumissionResponseDTO> approve(
            @PathVariable Long id,
            @RequestBody(required = false) FeedbackRequest feedbackRequest,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Name", required = false) String nom) {
        if (feedbackRequest == null) {
            feedbackRequest = new FeedbackRequest();
        }
        return approuverSoumission(id, feedbackRequest, roleHeader, email, nom);
    }

    /**
     * Rejette une soumission
     */
    @PostMapping("/rejeter/{id}")
    public ResponseEntity<SoumissionResponseDTO> rejeterSoumission(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Name", required = false) String nom) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.REJECT_SUBMISSION);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        soumission.setStatut(Soumission.StatutSoumission.REJETEE);
        soumission.setDateValidation(LocalDateTime.now());
        soumission.setValideePar(email);
        soumissionRepository.save(soumission);
        
        // Créer un feedback de rejet
        Feedback feedback = Feedback.builder()
            .soumission(soumission)
            .moderatorEmail(email)
            .moderatorName(nom)
            .commentaire(feedbackRequest.getCommentaire())
            .statut("REJECTED")
            .internal(feedbackRequest.isInternal())
            .build();
        
        feedbackRepository.save(feedback);
        
        // Envoyer une notification à l'auteur
        try {
            notificationClient.sendSubmissionRejectedNotification(
                soumission.getUserId(),
                soumission.getId(),
                soumission.getTitre(),
                feedbackRequest.getCommentaire()
            );
        } catch (Exception e) {
            log.warn("Erreur lors de l'envoi de la notification de rejet: {}", e.getMessage());
        }
        
        log.info("Soumission {} rejetée par {}", id, email);
        
        return ResponseEntity.ok(convertToDTO(soumission));
    }

    /**
     * Alias pour rejeter (nouveau endpoint)
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<SoumissionResponseDTO> reject(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Name", required = false) String nom) {
        return rejeterSoumission(id, feedbackRequest, roleHeader, email, nom);
    }

    /**
     * Demande des révisions sur une soumission
     */
    @PostMapping("/demander-revision/{id}")
    public ResponseEntity<SoumissionResponseDTO> demanderRevision(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Name", required = false) String nom) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.REQUEST_REVISION);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        soumission.setStatut(Soumission.StatutSoumission.EN_REVISION);
        soumissionRepository.save(soumission);
        
        // Créer un feedback de demande de révision
        Feedback feedback = Feedback.builder()
            .soumission(soumission)
            .moderatorEmail(email)
            .moderatorName(nom)
            .commentaire(feedbackRequest.getCommentaire())
            .statut("REVISION_REQUESTED")
            .internal(feedbackRequest.isInternal())
            .build();
        
        feedbackRepository.save(feedback);
        
        // Envoyer une notification à l'auteur
        try {
            notificationClient.sendRevisionRequestedNotification(
                soumission.getUserId(),
                soumission.getId(),
                soumission.getTitre(),
                feedbackRequest.getCommentaire()
            );
        } catch (Exception e) {
            log.warn("Erreur lors de l'envoi de la notification de révision: {}", e.getMessage());
        }
        
        log.info("Révision demandée pour soumission {} par {}", id, email);
        
        return ResponseEntity.ok(convertToDTO(soumission));
    }

    /**
     * Alias pour demander révision (nouveau endpoint)
     */
    @PostMapping("/{id}/request-revision")
    public ResponseEntity<SoumissionResponseDTO> requestRevision(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Name", required = false) String nom) {
        return demanderRevision(id, feedbackRequest, roleHeader, email, nom);
    }

    /**
     * Ajoute un commentaire interne (visible seulement par STAFF/ADMIN)
     */
    @PostMapping("/commentaire-interne/{id}")
    public ResponseEntity<FeedbackDTO> ajouterCommentaireInterne(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Name", required = false) String nom) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.MODERATE);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        Feedback feedback = Feedback.builder()
            .soumission(soumission)
            .moderatorEmail(email)
            .moderatorName(nom)
            .commentaire(feedbackRequest.getCommentaire())
            .statut("INTERNAL_NOTE")
            .internal(true) // Toujours interne
            .build();
        
        feedbackRepository.save(feedback);
        
        log.info("Commentaire interne ajouté à soumission {} par {}", id, email);
        
        return ResponseEntity.ok(convertFeedbackToDTO(feedback));
    }

    /**
     * Récupère tous les feedbacks d'une soumission (incluant internes)
     */
    @GetMapping("/soumission/{id}/feedbacks")
    public ResponseEntity<List<FeedbackDTO>> getTousFeedbacks(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.MODERATE);
        
        List<Feedback> feedbacks = feedbackRepository.findBySoumissionId(id);
        
        return ResponseEntity.ok(feedbacks.stream()
            .map(this::convertFeedbackToDTO)
            .collect(Collectors.toList()));
    }

    // Classes internes
    @Data
    public static class FeedbackRequest {
        private String commentaire;
        private boolean internal = false;
    }

    // Méthodes de conversion
    private SoumissionResponseDTO convertToDTO(Soumission soumission) {
        SoumissionResponseDTO dto = new SoumissionResponseDTO();
        dto.setId(soumission.getId());
        dto.setTitre(soumission.getTitre());
        dto.setAuteurPrincipal(soumission.getAuteurPrincipal());
        dto.setEmailAuteur(soumission.getEmailAuteur());
        dto.setResume(soumission.getResume());
        dto.setStatut(soumission.getStatut());
        dto.setDateSoumission(soumission.getDateSoumission());
        dto.setDomaineRecherche(soumission.getDomaineRecherche());
        dto.setMotsCles(soumission.getMotsCles());
        dto.setCoAuteurs(soumission.getCoAuteurs());
        dto.setCommentaireAdmin(soumission.getCommentaireAdmin());
        dto.setValideePar(soumission.getValideePar());
        dto.setDateValidation(soumission.getDateValidation());
        return dto;
    }

    private FeedbackDTO convertFeedbackToDTO(Feedback feedback) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(feedback.getId());
        dto.setSoumissionId(feedback.getSoumission().getId());
        dto.setModeratorEmail(feedback.getModeratorEmail());
        dto.setModeratorName(feedback.getModeratorName());
        dto.setCommentaire(feedback.getCommentaire());
        dto.setStatut(feedback.getStatut());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setInternal(feedback.isInternal());
        return dto;
    }
}
