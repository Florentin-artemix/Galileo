package com.galileo.ecriture.service;

import com.galileo.ecriture.dto.UserDTO;
import com.galileo.ecriture.security.Role;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service pour la gestion des utilisateurs Firebase
 */
@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    /**
     * Lister tous les utilisateurs Firebase
     */
    public List<UserDTO> listerUtilisateurs() {
        List<UserDTO> users = new ArrayList<>();
        
        try {
            ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
            while (page != null) {
                for (UserRecord user : page.iterateAll()) {
                    UserDTO dto = convertToDTO(user);
                    users.add(dto);
                }
                page = page.getNextPage();
            }
        } catch (FirebaseAuthException e) {
            logger.error("Erreur lors de la récupération des utilisateurs", e);
            throw new RuntimeException("Impossible de récupérer les utilisateurs: " + e.getMessage());
        }
        
        return users;
    }

    /**
     * Obtenir un utilisateur par UID
     */
    public UserDTO obtenirUtilisateur(String uid) {
        try {
            UserRecord user = FirebaseAuth.getInstance().getUser(uid);
            return convertToDTO(user);
        } catch (FirebaseAuthException e) {
            logger.error("Utilisateur non trouvé: {}", uid, e);
            throw new RuntimeException("Utilisateur non trouvé: " + uid);
        }
    }

    /**
     * Modifier le rôle d'un utilisateur (via Firebase custom claims)
     */
    public void modifierRole(String uid, Role role) {
        try {
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", role.name());
            
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
            logger.info("Rôle {} attribué à l'utilisateur {}", role, uid);
            
            // Forcer la révocation des tokens pour que l'utilisateur reçoive le nouveau rôle
            FirebaseAuth.getInstance().revokeRefreshTokens(uid);
            logger.info("Tokens révoqués pour l'utilisateur {} - il devra se reconnecter", uid);
            
        } catch (FirebaseAuthException e) {
            logger.error("Erreur lors de la modification du rôle de {}", uid, e);
            throw new RuntimeException("Impossible de modifier le rôle: " + e.getMessage());
        }
    }

    /**
     * Convertir un UserRecord Firebase en UserDTO
     */
    private UserDTO convertToDTO(UserRecord user) {
        UserDTO dto = new UserDTO();
        dto.setUid(user.getUid());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setDisabled(user.isDisabled());
        
        // Récupérer le rôle depuis les custom claims
        Map<String, Object> claims = user.getCustomClaims();
        if (claims != null && claims.containsKey("role")) {
            try {
                dto.setRole(Role.valueOf(claims.get("role").toString().toUpperCase()));
            } catch (IllegalArgumentException e) {
                dto.setRole(Role.VIEWER); // Défaut
            }
        } else {
            dto.setRole(Role.VIEWER); // Défaut si pas de rôle
        }
        
        // Dates
        if (user.getUserMetadata() != null) {
            dto.setCreationTime(String.valueOf(user.getUserMetadata().getCreationTimestamp()));
            dto.setLastSignInTime(String.valueOf(user.getUserMetadata().getLastSignInTimestamp()));
        }
        
        return dto;
    }
}
