package com.galileo.ecriture.controller;

import com.galileo.ecriture.dto.SoumissionCreationDTO;
import com.galileo.ecriture.dto.SoumissionResponseDTO;
import com.galileo.ecriture.service.SoumissionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/soumissions")
public class SoumissionController {

    private static final Logger logger = LoggerFactory.getLogger(SoumissionController.class);

    private final SoumissionService soumissionService;

    public SoumissionController(SoumissionService soumissionService) {
        this.soumissionService = soumissionService;
    }

    /**
     * POST /api/soumissions - Créer une nouvelle soumission avec upload de fichier
     * Headers requis: X-User-Id, X-User-Email (injectés par le Gateway)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> creerSoumission(
            @RequestParam("fichierPdf") MultipartFile fichierPdf,
            @RequestParam("titre") String titre,
            @RequestParam("resume") String resume,
            @RequestParam("auteurPrincipal") String auteurPrincipal,
            @RequestParam("emailAuteur") String emailAuteur,
            @RequestParam(value = "coAuteurs", required = false) List<String> coAuteurs,
            @RequestParam("motsCles") List<String> motsCles,
            @RequestParam("domaineRecherche") String domaineRecherche,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Email") String userEmail) {

        try {
            // Construire le DTO
            SoumissionCreationDTO dto = new SoumissionCreationDTO();
            dto.setTitre(titre);
            dto.setResume(resume);
            dto.setAuteurPrincipal(auteurPrincipal);
            dto.setEmailAuteur(emailAuteur);
            dto.setCoAuteurs(coAuteurs);
            dto.setMotsCles(motsCles);
            dto.setDomaineRecherche(domaineRecherche);
            dto.setNotes(notes);

            // Créer la soumission
            SoumissionResponseDTO response = soumissionService.creerSoumission(
                    dto, fichierPdf, userId, userEmail);

            logger.info("Soumission créée avec succès: {} par {}", response.getId(), userEmail);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            logger.warn("Validation échouée: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "erreur", "Validation échouée",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Erreur lors de la création de la soumission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "erreur", "Erreur serveur",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/soumissions - Lister mes soumissions
     */
    @GetMapping
    public ResponseEntity<List<SoumissionResponseDTO>> listerMesSoumissions(
            @RequestHeader("X-User-Id") String userId) {
        
        List<SoumissionResponseDTO> soumissions = soumissionService.listerSoumissionsUtilisateur(userId);
        return ResponseEntity.ok(soumissions);
    }

    /**
     * GET /api/soumissions/{id} - Obtenir une soumission spécifique
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenirSoumission(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId) {
        
        try {
            SoumissionResponseDTO soumission = soumissionService.obtenirSoumission(id, userId);
            return ResponseEntity.ok(soumission);
        } catch (RuntimeException e) {
            logger.warn("Erreur lors de la récupération de la soumission {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "erreur", "Soumission non trouvée",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * DELETE /api/soumissions/{id} - Retirer ma soumission
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> retirerSoumission(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId) {
        
        try {
            soumissionService.retirerSoumission(id, userId);
            return ResponseEntity.ok(Map.of(
                    "message", "Soumission retirée avec succès",
                    "id", id
            ));
        } catch (RuntimeException e) {
            logger.warn("Erreur lors du retrait de la soumission {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "erreur", "Impossible de retirer la soumission",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "galileo-ecriture");
        return ResponseEntity.ok(response);
    }
}
