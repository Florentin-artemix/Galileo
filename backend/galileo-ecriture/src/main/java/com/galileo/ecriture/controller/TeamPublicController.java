package com.galileo.ecriture.controller;

import com.galileo.ecriture.dto.UserDTO;
import com.galileo.ecriture.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur PUBLIC pour afficher les membres de l'équipe (STAFF/ADMIN)
 * Accessible sans authentification pour la page "Notre Équipe"
 */
@RestController
@RequestMapping("/public/team")
public class TeamPublicController {

    private static final Logger logger = LoggerFactory.getLogger(TeamPublicController.class);
    private final UserService userService;

    public TeamPublicController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/public/team - Récupérer tous les membres de l'équipe (STAFF + ADMIN)
     * Endpoint public pour la page "Notre Équipe"
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> getTeamMembers() {
        List<UserDTO> teamMembers = userService.getTeamMembers();
        logger.info("Récupération de {} membres d'équipe", teamMembers.size());
        return ResponseEntity.ok(teamMembers);
    }

    /**
     * GET /api/public/team/role/{role} - Récupérer les membres par rôle
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getTeamMembersByRole(@PathVariable String role) {
        List<UserDTO> members = userService.getUsersByRole(role);
        logger.info("Récupération de {} membres avec rôle {}", members.size(), role);
        return ResponseEntity.ok(members);
    }
}

