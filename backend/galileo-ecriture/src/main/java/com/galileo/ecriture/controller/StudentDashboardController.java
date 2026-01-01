package com.galileo.ecriture.controller;

import com.galileo.ecriture.dto.FeedbackDTO;
import com.galileo.ecriture.dto.SoumissionResponseDTO;
import com.galileo.ecriture.security.Role;
import com.galileo.ecriture.entity.Feedback;
import com.galileo.ecriture.entity.Soumission;
import com.galileo.ecriture.repository.FeedbackRepository;
import com.galileo.ecriture.repository.SoumissionRepository;
import com.galileo.ecriture.security.Permission;
import com.galileo.ecriture.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
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
    public ResponseEntity<List<SoumissionResponseDTO>> getMesSoumissions(HttpServletRequest request) {
        log.info("Récupération des soumissions de l'étudiant");
        
        String email = (String) request.getAttribute("userEmail");
        Role role = (Role) request.getAttribute("userRole");
        
        // Vérifier que l'utilisateur a le droit de soumettre (STUDENT, STAFF, ADMIN)
        roleGuard.requirePermission(role, Permission.SUBMIT);
        
        List<Soumission> soumissions = soumissionRepository.findByUserEmailOrderByDateSoumissionDesc(email);
        
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
        
        List<Soumission> soumissions = soumissionRepository.findByUserEmailOrderByDateSoumissionDesc(email);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", soumissions.size());
        stats.put("en_attente", soumissions.stream().filter(s -> Soumission.StatutSoumission.EN_ATTENTE.equals(s.getStatut())).count());
        stats.put("validee", soumissions.stream().filter(s -> Soumission.StatutSoumission.VALIDEE.equals(s.getStatut())).count());
        stats.put("rejetee", soumissions.stream().filter(s -> Soumission.StatutSoumission.REJETEE.equals(s.getStatut())).count());
        stats.put("en_revision", soumissions.stream().filter(s -> Soumission.StatutSoumission.EN_REVISION.equals(s.getStatut())).count());
        
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
        if (!soumission.getUserEmail().equals(email)) {
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
    public ResponseEntity<List<SoumissionResponseDTO>> getSoumissionsParStatut(
            @PathVariable String statut,
            HttpServletRequest request) {
        
        String email = (String) request.getAttribute("userEmail");
        Role role = (Role) request.getAttribute("userRole");
        
        roleGuard.requirePermission(role, Permission.VIEW_OWN);
        
        List<Soumission> soumissions = soumissionRepository.findByUserEmailOrderByDateSoumissionDesc(email).stream()
            .filter(s -> statut.equalsIgnoreCase(s.getStatut().name()))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(soumissions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));
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
