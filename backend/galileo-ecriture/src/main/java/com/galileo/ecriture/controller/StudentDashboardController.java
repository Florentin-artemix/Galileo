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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur pour le dashboard des étudiants (STUDENT role)
 * Permet de gérer ses propres soumissions et voir les feedbacks
 */
@RestController
@RequestMapping("/api/student/dashboard")
@RequiredArgsConstructor
@Slf4j
public class StudentDashboardController {

    private final SoumissionRepository soumissionRepository;
    private final FeedbackRepository feedbackRepository;
    private final RoleGuard roleGuard;

    /**
     * Récupère toutes les soumissions de l'étudiant connecté
     */
    @GetMapping("/mes-soumissions")
    public ResponseEntity<List<SoumissionDTO>> getMesSoumissions(HttpServletRequest request) {
        log.info("Récupération des soumissions de l'étudiant");
        
        String email = (String) request.getAttribute("userEmail");
        Role role = (Role) request.getAttribute("userRole");
        
        // Vérifier que l'utilisateur a le droit de soumettre (STUDENT, STAFF, ADMIN)
        roleGuard.requirePermission(role, Permission.SUBMIT);
        
        List<Soumission> soumissions = soumissionRepository.findByAuteurEmail(email);
        
        return ResponseEntity.ok(soumissions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
    }

    /**
     * Récupère les statistiques des soumissions de l'étudiant
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques(HttpServletRequest request) {
        log.info("Récupération des statistiques de l'étudiant");
        
        String email = (String) request.getAttribute("userEmail");
        Role role = (Role) request.getAttribute("userRole");
        
        roleGuard.requirePermission(role, Permission.SUBMIT);
        
        List<Soumission> soumissions = soumissionRepository.findByAuteurEmail(email);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", soumissions.size());
        stats.put("brouillon", soumissions.stream().filter(s -> "BROUILLON".equals(s.getStatut())).count());
        stats.put("en_attente", soumissions.stream().filter(s -> "EN_ATTENTE".equals(s.getStatut())).count());
        stats.put("acceptee", soumissions.stream().filter(s -> "ACCEPTEE".equals(s.getStatut())).count());
        stats.put("refusee", soumissions.stream().filter(s -> "REFUSEE".equals(s.getStatut())).count());
        stats.put("revision", soumissions.stream().filter(s -> "REVISION_DEMANDEE".equals(s.getStatut())).count());
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Récupère une soumission spécifique avec ses feedbacks
     */
    @GetMapping("/soumission/{id}")
    public ResponseEntity<Map<String, Object>> getSoumissionAvecFeedbacks(
            @PathVariable Long id,
            HttpServletRequest request) {
        
        String email = (String) request.getAttribute("userEmail");
        Role role = (Role) request.getAttribute("userRole");
        
        roleGuard.requirePermission(role, Permission.VIEW_OWN);
        
        Soumission soumission = soumissionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Soumission non trouvée"));
        
        // Vérifier que c'est bien la soumission de l'utilisateur
        if (!soumission.getAuteurEmail().equals(email)) {
            throw new RuntimeException("Accès non autorisé à cette soumission");
        }
        
        // Récupérer seulement les feedbacks non-internes (visibles par STUDENT)
        List<Feedback> feedbacks = feedbackRepository.findBySoumissionIdAndInternalFalse(id);
        
        Map<String, Object> result = new HashMap<>();
        result.put("soumission", convertToDTO(soumission));
        result.put("feedbacks", feedbacks.stream()
            .map(this::convertFeedbackToDTO)
            .collect(Collectors.toList()));
        
        return ResponseEntity.ok(result);
    }

    /**
     * Récupère toutes les soumissions par statut
     */
    @GetMapping("/soumissions/statut/{statut}")
    public ResponseEntity<List<SoumissionDTO>> getSoumissionsParStatut(
            @PathVariable String statut,
            HttpServletRequest request) {
        
        String email = (String) request.getAttribute("userEmail");
        Role role = (Role) request.getAttribute("userRole");
        
        roleGuard.requirePermission(role, Permission.VIEW_OWN);
        
        List<Soumission> soumissions = soumissionRepository.findByAuteurEmail(email).stream()
            .filter(s -> statut.equalsIgnoreCase(s.getStatut()))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(soumissions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
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
