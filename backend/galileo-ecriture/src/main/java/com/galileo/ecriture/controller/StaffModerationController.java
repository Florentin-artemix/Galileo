package com.galileo.ecriture.controller;

import com.galileo.ecriture.dto.FeedbackDTO;
import com.galileo.ecriture.dto.SoumissionDTO;
import com.galileo.ecriture.entity.Feedback;
import com.galileo.ecriture.entity.Role;
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

import javax.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/staff/moderation")
@RequiredArgsConstructor
@Slf4j
public class StaffModerationController {

    private final SoumissionRepository soumissionRepository;
    private final FeedbackRepository feedbackRepository;
    private final RoleGuard roleGuard;

    /**
     * Récupère la file de modération (soumissions en attente)
     */
    @GetMapping("/queue")
    public ResponseEntity<List<SoumissionDTO>> getModerationQueue(HttpServletRequest request) {
        log.info("Récupération de la file de modération");
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.MODERATE);
        
        List<Soumission> soumissions = soumissionRepository.findByStatut("EN_ATTENTE");
        
        return ResponseEntity.ok(soumissions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
    }

    /**
     * Récupère toutes les soumissions avec filtres avancés
     */
    @GetMapping("/soumissions")
    public ResponseEntity<List<SoumissionDTO>> getSoumissionsAvecFiltres(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String auteurEmail,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.VIEW_ALL);
        
        List<Soumission> soumissions;
        
        if (statut != null && !statut.isEmpty()) {
            soumissions = soumissionRepository.findByStatut(statut);
        } else if (auteurEmail != null && !auteurEmail.isEmpty()) {
            soumissions = soumissionRepository.findByAuteurEmail(auteurEmail);
        } else {
            soumissions = soumissionRepository.findAll();
        }
        
        return ResponseEntity.ok(soumissions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
    }

    /**
     * Récupère les statistiques de modération
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiquesModeration(HttpServletRequest request) {
        log.info("Récupération des statistiques de modération");
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.VIEW_STATISTICS);
        
        List<Soumission> toutes = soumissionRepository.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", toutes.size());
        stats.put("en_attente", toutes.stream().filter(s -> "EN_ATTENTE".equals(s.getStatut())).count());
        stats.put("acceptee", toutes.stream().filter(s -> "ACCEPTEE".equals(s.getStatut())).count());
        stats.put("refusee", toutes.stream().filter(s -> "REFUSEE".equals(s.getStatut())).count());
        stats.put("revision", toutes.stream().filter(s -> "REVISION_DEMANDEE".equals(s.getStatut())).count());
        stats.put("brouillon", toutes.stream().filter(s -> "BROUILLON".equals(s.getStatut())).count());
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Approuve une soumission
     */
    @PostMapping("/approuver/{id}")
    public ResponseEntity<SoumissionDTO> approuverSoumission(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        String email = (String) request.getAttribute("userEmail");
        String nom = (String) request.getAttribute("userName");
        
        roleGuard.requirePermission(role, Permission.APPROVE_SUBMISSION);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        soumission.setStatut("ACCEPTEE");
        soumission.setDateModification(LocalDateTime.now());
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
        
        log.info("Soumission {} approuvée par {}", id, email);
        
        return ResponseEntity.ok(convertToDTO(soumission));
    }

    /**
     * Rejette une soumission
     */
    @PostMapping("/rejeter/{id}")
    public ResponseEntity<SoumissionDTO> rejeterSoumission(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        String email = (String) request.getAttribute("userEmail");
        String nom = (String) request.getAttribute("userName");
        
        roleGuard.requirePermission(role, Permission.REJECT_SUBMISSION);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        soumission.setStatut("REFUSEE");
        soumission.setDateModification(LocalDateTime.now());
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
        
        log.info("Soumission {} rejetée par {}", id, email);
        
        return ResponseEntity.ok(convertToDTO(soumission));
    }

    /**
     * Demande des révisions sur une soumission
     */
    @PostMapping("/demander-revision/{id}")
    public ResponseEntity<SoumissionDTO> demanderRevision(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        String email = (String) request.getAttribute("userEmail");
        String nom = (String) request.getAttribute("userName");
        
        roleGuard.requirePermission(role, Permission.REQUEST_REVISION);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        soumission.setStatut("REVISION_DEMANDEE");
        soumission.setDateModification(LocalDateTime.now());
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
        
        log.info("Révision demandée pour soumission {} par {}", id, email);
        
        return ResponseEntity.ok(convertToDTO(soumission));
    }

    /**
     * Ajoute un commentaire interne (visible seulement par STAFF/ADMIN)
     */
    @PostMapping("/commentaire-interne/{id}")
    public ResponseEntity<FeedbackDTO> ajouterCommentaireInterne(
            @PathVariable Long id,
            @RequestBody FeedbackRequest feedbackRequest,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        String email = (String) request.getAttribute("userEmail");
        String nom = (String) request.getAttribute("userName");
        
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
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
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
    private SoumissionDTO convertToDTO(Soumission soumission) {
        SoumissionDTO dto = new SoumissionDTO();
        dto.setId(soumission.getId());
        dto.setTitre(soumission.getTitre());
        dto.setAuteurs(soumission.getAuteurs());
        dto.setAuteurEmail(soumission.getAuteurEmail());
        dto.setResume(soumission.getResume());
        dto.setContenu(soumission.getContenu());
        dto.setStatut(soumission.getStatut());
        dto.setDateSoumission(soumission.getDateSoumission());
        dto.setDateModification(soumission.getDateModification());
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
