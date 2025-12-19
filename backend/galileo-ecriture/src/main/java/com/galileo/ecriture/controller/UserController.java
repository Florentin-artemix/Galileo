package com.galileo.ecriture.controller;

import com.galileo.ecriture.security.Role;
import com.galileo.ecriture.security.RoleGuard;
import com.galileo.ecriture.service.UserService;
import com.galileo.ecriture.dto.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur pour la gestion des utilisateurs
 * Permet aux ADMIN de gérer les rôles des utilisateurs
 */
@RestController
@RequestMapping("/admin/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final RoleGuard roleGuard;

    public UserController(UserService userService, RoleGuard roleGuard) {
        this.userService = userService;
        this.roleGuard = roleGuard;
    }

    /**
     * POST /api/admin/users/self-register - Auto-inscription avec rôle choisi
     * Endpoint pour permettre l'attribution du rôle initial lors de l'inscription
     * Ne révoque pas les tokens (l'utilisateur vient de s'inscrire)
     */
    @PostMapping("/self-register")
    public ResponseEntity<?> autoInscription(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        String uid = body.get("uid");
        String roleStr = body.get("role");
        String email = body.get("email");

        if (uid == null || uid.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "UID requis"));
        }
        if (roleStr == null || roleStr.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Rôle requis"));
        }

        try {
            Role targetRole = Role.valueOf(roleStr.toUpperCase());
            // Utiliser attribuerRoleInitial pour ne pas révoquer les tokens
            userService.attribuerRoleInitial(uid, targetRole);
            logger.info("Auto-inscription: utilisateur {} enregistré avec rôle {}", uid, targetRole);
            return ResponseEntity.ok(Map.of(
                "message", "Inscription réussie",
                "uid", uid,
                "role", targetRole.name(),
                "email", email != null ? email : ""
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Rôle invalide: " + roleStr));
        } catch (Exception e) {
            logger.error("Erreur lors de l'auto-inscription de {}", uid, e);
            return ResponseEntity.internalServerError().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/users - Lister tous les utilisateurs
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> listerUtilisateurs(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN);
        
        List<UserDTO> users = userService.listerUtilisateurs();
        logger.info("Récupération de {} utilisateurs", users.size());
        return ResponseEntity.ok(users);
    }

    /**
     * PUT /api/admin/users/{uid}/role - Modifier le rôle d'un utilisateur
     */
    @PutMapping("/{uid}/role")
    public ResponseEntity<?> modifierRole(
            @PathVariable String uid,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Email") String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role currentRole = roleGuard.resolveRole(roleHeader);
        roleGuard.require(currentRole, Role.ADMIN);

        String newRole = body.get("role");
        if (newRole == null || newRole.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Le rôle est requis"));
        }

        try {
            Role targetRole = Role.valueOf(newRole.toUpperCase());
            userService.modifierRole(uid, targetRole);
            logger.info("Rôle de l'utilisateur {} modifié en {} par {}", uid, targetRole, adminEmail);
            return ResponseEntity.ok(Map.of("message", "Rôle modifié avec succès", "uid", uid, "role", targetRole.name()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Rôle invalide: " + newRole));
        } catch (Exception e) {
            logger.error("Erreur lors de la modification du rôle de {}", uid, e);
            return ResponseEntity.internalServerError().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/users/{uid} - Obtenir les détails d'un utilisateur
     */
    @GetMapping("/{uid}")
    public ResponseEntity<?> obtenirUtilisateur(
            @PathVariable String uid,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String roleHeader) {

        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.require(role, Role.ADMIN);

        try {
            UserDTO user = userService.obtenirUtilisateur(uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
