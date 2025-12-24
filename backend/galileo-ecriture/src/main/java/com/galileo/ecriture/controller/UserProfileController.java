package com.galileo.ecriture.controller;

import com.galileo.ecriture.dto.UserDTO;
import com.galileo.ecriture.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints accessibles par tout utilisateur authentifié pour récupérer son profil/role.
 */
@RestController
@RequestMapping("/users")
public class UserProfileController {

    private static final Logger logger = LoggerFactory.getLogger(UserProfileController.class);
    private final UserService userService;

    public UserProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @RequestHeader(value = "X-User-Id", required = false) String uid,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {

        try {
            if (uid == null || uid.isBlank()) {
                return ResponseEntity.status(401).body("X-User-Id manquant");
            }
            UserDTO user = userService.obtenirProfil(uid, email, roleHeader);
            logger.info("Profil utilisateur récupéré pour {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération du profil pour {}", uid, e);
            return ResponseEntity.status(500).body("Erreur lors de la récupération du profil: " + e.getMessage());
        }
    }
}

