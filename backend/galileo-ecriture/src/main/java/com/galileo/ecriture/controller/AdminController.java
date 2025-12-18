package com.galileo.ecriture.controller;

import com.galileo.ecriture.dto.SoumissionResponseDTO;
import com.galileo.ecriture.dto.ValidationDTO;
import com.galileo.ecriture.entity.Soumission.StatutSoumission;
import com.galileo.ecriture.security.Role;
import com.galileo.ecriture.security.RoleGuard;
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
    private final RoleGuard roleGuard;

    public AdminController(AdminService adminService, RoleGuard roleGuard) {
        this.adminService = adminService;
        this.roleGuard = roleGuard;
    }

    /**
     * GET /api/admin/soumissions/en-attente - Lister les soumissions en attente
     */
    @GetMapping("/en-attente")
    public ResponseEntity<List<SoumissionResponseDTO>> listerSoumissionsEnAttente(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN, Role.STAFF);
        List<SoumissionResponseDTO> soumissions = adminService.listerSoumissionsEnAttente();
        logger.info("Récupération de {} soumissions en attente", soumissions.size());
        return ResponseEntity.ok(soumissions);
    }

    /**
     * GET /api/admin/soumissions?statut=XXX - Lister les soumissions par statut
     */
    @GetMapping
    public ResponseEntity<List<SoumissionResponseDTO>> listerSoumissionsParStatut(
            @RequestParam(required = false) String statut,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN, Role.STAFF);
        
        if (statut == null) {
            List<SoumissionResponseDTO> soumissions = adminService.listerSoumissionsEnAttente();
            return ResponseEntity.ok(soumissions);
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
    public ResponseEntity<Map<String, Long>> obtenirStatistiques(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN, Role.STAFF);
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
            @RequestHeader("X-User-Email") String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN, Role.STAFF);
        
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
            @RequestHeader("X-User-Email") String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN, Role.STAFF);
        
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
            @RequestHeader("X-User-Email") String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN, Role.STAFF);
        
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

    /**
     * PUT /api/admin/soumissions/{id}/statut - Changer le statut d'une soumission
     * Endpoint simplifié pour le frontend
     */
    @PutMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Email") String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN, Role.STAFF);
        
        String statut = body.get("statut");
        if (statut == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Le statut est requis"));
        }

        try {
            StatutSoumission nouveauStatut = StatutSoumission.valueOf(statut.toUpperCase());
            SoumissionResponseDTO response;

            switch (nouveauStatut) {
                case VALIDEE:
                    response = adminService.validerSoumission(id, "", adminEmail);
                    break;
                case REJETEE:
                    response = adminService.rejeterSoumission(id, "", adminEmail);
                    break;
                case EN_REVISION:
                    response = adminService.demanderRevisions(id, "", adminEmail);
                    break;
                case EN_ATTENTE:
                default:
                    return ResponseEntity.badRequest().body(Map.of("erreur", "Statut invalide: " + statut));
            }

            logger.info("Statut de la soumission {} changé en {} par {}", id, nouveauStatut, adminEmail);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Statut invalide: " + statut));
        } catch (RuntimeException e) {
            logger.error("Erreur lors du changement de statut de la soumission {}", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "erreur", "Erreur de modification",
                    "message", e.getMessage()
            ));
        }
    }
}
