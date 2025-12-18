package com.galileo.lecture.controller;

import com.galileo.lecture.dto.TeamMemberCreateDTO;
import com.galileo.lecture.dto.TeamMemberDTO;
import com.galileo.lecture.service.TeamMemberService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour les membres de l'équipe
 */
@Slf4j
@RestController
@RequestMapping("/team")
public class TeamMemberController {

    private final TeamMemberService teamMemberService;

    public TeamMemberController(TeamMemberService teamMemberService) {
        this.teamMemberService = teamMemberService;
    }

    /**
     * GET /team - Lister tous les membres actifs
     */
    @GetMapping
    public ResponseEntity<List<TeamMemberDTO>> getAllMembers() {
        log.info("Récupération des membres de l'équipe");
        List<TeamMemberDTO> members = teamMemberService.getAllActiveMembers();
        return ResponseEntity.ok(members);
    }

    /**
     * GET /team/{id} - Récupérer un membre par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TeamMemberDTO> getMemberById(@PathVariable Long id) {
        log.info("Récupération du membre ID: {}", id);
        try {
            TeamMemberDTO member = teamMemberService.getMemberById(id);
            return ResponseEntity.ok(member);
        } catch (RuntimeException e) {
            log.warn("Membre non trouvé: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /team/role/{role} - Membres par rôle
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<TeamMemberDTO>> getMembersByRole(@PathVariable String role) {
        log.info("Récupération des membres par rôle: {}", role);
        List<TeamMemberDTO> members = teamMemberService.getMembersByRole(role);
        return ResponseEntity.ok(members);
    }

    /**
     * POST /team - Créer un nouveau membre
     */
    @PostMapping
    public ResponseEntity<TeamMemberDTO> createMember(@Valid @RequestBody TeamMemberCreateDTO dto) {
        log.info("Création d'un nouveau membre: {}", dto.getName());
        TeamMemberDTO created = teamMemberService.createMember(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /team/{id} - Mettre à jour un membre
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMember(
            @PathVariable Long id,
            @Valid @RequestBody TeamMemberCreateDTO dto) {
        log.info("Mise à jour du membre ID: {}", id);
        try {
            TeamMemberDTO updated = teamMemberService.updateMember(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Erreur mise à jour membre {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur de mise à jour",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * DELETE /team/{id} - Supprimer un membre
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMember(@PathVariable Long id) {
        log.info("Suppression du membre ID: {}", id);
        try {
            teamMemberService.deleteMember(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erreur suppression membre {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur de suppression",
                    "message", e.getMessage()
            ));
        }
    }
}
