package com.galileo.ecriture.controller;

import com.galileo.ecriture.dto.SoumissionResponseDTO;
import com.galileo.ecriture.dto.ValidationDTO;
import com.galileo.ecriture.entity.Soumission.StatutSoumission;
import com.galileo.ecriture.service.AdminService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur Admin pour la gestion des soumissions
 * Tous les endpoints nécessitent l'authentification (headers X-User-Id et X-User-Email)
 * TODO: Ajouter vérification du rôle ADMIN dans un filtre ou via Firebase custom claims
 */
@RestController
@RequestMapping("/admin/soumissions")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * GET /api/admin/soumissions/en-attente - Lister les soumissions en attente
     */
    @GetMapping("/en-attente")
    public ResponseEntity<List<SoumissionResponseDTO>> listerSoumissionsEnAttente() {
        List<SoumissionResponseDTO> soumissions = adminService.listerSoumissionsEnAttente();
        logger.info("Récupération de {} soumissions en attente", soumissions.size());
        return ResponseEntity.ok(soumissions);
    }

    /**
     * GET /api/admin/soumissions?statut=XXX - Lister les soumissions par statut
     */
    @GetMapping
    public ResponseEntity<List<SoumissionResponseDTO>> listerSoumissionsParStatut(
            @RequestParam(required = false) String statut) {
        
        if (statut == null) {
            // Retourner toutes les soumissions en attente par défaut
            return listerSoumissionsEnAttente();
        }

        try {
            StatutSoumission statutEnum = StatutSoumission.valueOf(statut.toUpperCase());
            List<SoumissionResponseDTO> soumissions = adminService.listerSoumissionsParStatut(statutEnum);
            logger.info("Récupération de {} soumissions avec statut {}", soumissions.size(), statut);
            return ResponseEntity.ok(soumissions);
        } catch (IllegalArgumentException e) {
            logger.warn("Statut invalide demandé: {}", statut);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/admin/soumissions/statistiques - Obtenir les statistiques
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Long>> obtenirStatistiques() {
        Map<String, Long> stats = adminService.obtenirStatistiques();
        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/admin/soumissions/{id}/valider - Valider une soumission
     */
    @PostMapping("/{id}/valider")
    public ResponseEntity<?> validerSoumission(
            @PathVariable Long id,
            @Valid @RequestBody ValidationDTO validationDTO,
            @RequestHeader("X-User-Email") String adminEmail) {
        
        try {
            SoumissionResponseDTO response = adminService.validerSoumission(
                    id, validationDTO.getCommentaire(), adminEmail);
            
            logger.info("Soumission {} validée par {}", id, adminEmail);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la validation de la soumission {}", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "erreur", "Erreur de validation",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/admin/soumissions/{id}/rejeter - Rejeter une soumission
     */
    @PostMapping("/{id}/rejeter")
    public ResponseEntity<?> rejeterSoumission(
            @PathVariable Long id,
            @Valid @RequestBody ValidationDTO validationDTO,
            @RequestHeader("X-User-Email") String adminEmail) {
        
        try {
            SoumissionResponseDTO response = adminService.rejeterSoumission(
                    id, validationDTO.getCommentaire(), adminEmail);
            
            logger.info("Soumission {} rejetée par {}", id, adminEmail);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Erreur lors du rejet de la soumission {}", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "erreur", "Erreur de rejet",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/admin/soumissions/{id}/demander-revisions - Demander des révisions
     */
    @PostMapping("/{id}/demander-revisions")
    public ResponseEntity<?> demanderRevisions(
            @PathVariable Long id,
            @Valid @RequestBody ValidationDTO validationDTO,
            @RequestHeader("X-User-Email") String adminEmail) {
        
        try {
            SoumissionResponseDTO response = adminService.demanderRevisions(
                    id, validationDTO.getCommentaire(), adminEmail);
            
            logger.info("Révisions demandées pour soumission {} par {}", id, adminEmail);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la demande de révisions pour soumission {}", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "erreur", "Erreur lors de la demande de révisions",
                    "message", e.getMessage()
            ));
        }
    }
}
