package com.galileo.ecriture.service;

import com.galileo.ecriture.dto.UserDTO;
import com.galileo.ecriture.entity.User;
import com.galileo.ecriture.repository.UserRepository;
import com.galileo.ecriture.security.Role;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des utilisateurs Firebase
 */
@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Lister tous les utilisateurs depuis PostgreSQL
     * Plus besoin de Firebase Admin SDK - fonctionne sans compte de facturation
     */
    public List<UserDTO> listerUtilisateurs() {
        try {
            List<User> users = userRepository.findAll();
            logger.info("Récupération réussie de {} utilisateurs depuis PostgreSQL", users.size());
            return users.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des utilisateurs depuis PostgreSQL", e);
            throw new RuntimeException("Impossible de récupérer les utilisateurs: " + e.getMessage());
        }
    }

    /**
     * Obtenir un utilisateur par UID depuis PostgreSQL
     */
    public UserDTO obtenirUtilisateur(String uid) {
        try {
            User user = userRepository.findByUid(uid)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + uid));
            return convertToDTO(user);
        } catch (Exception e) {
            logger.error("Utilisateur non trouvé: {}", uid, e);
            throw new RuntimeException("Utilisateur non trouvé: " + uid);
        }
    }

    /**
     * Modifier le rôle d'un utilisateur (via Firebase custom claims et PostgreSQL)
     * Révoque les tokens pour forcer la reconnexion avec le nouveau rôle
     */
    @Transactional
    public void modifierRole(String uid, Role role) {
        try {
            // Mettre à jour dans Firebase (si disponible)
            if (!FirebaseApp.getApps().isEmpty()) {
                try {
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("role", role.name());
                    FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
                    logger.info("Rôle {} attribué à l'utilisateur {} dans Firebase", role, uid);
                    
                    // Forcer la révocation des tokens pour que l'utilisateur reçoive le nouveau rôle
                    FirebaseAuth.getInstance().revokeRefreshTokens(uid);
                    logger.info("Tokens révoqués pour l'utilisateur {} - il devra se reconnecter", uid);
                } catch (FirebaseAuthException e) {
                    logger.warn("Impossible de modifier le rôle dans Firebase (peut nécessiter un compte de facturation): {}", e.getMessage());
                    // Continue quand même pour mettre à jour PostgreSQL
                }
            }
            
            // Mettre à jour dans PostgreSQL
            User user = userRepository.findByUid(uid)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + uid));
            user.setRole(role);
            userRepository.save(user);
            logger.info("Rôle {} mis à jour pour l'utilisateur {} dans PostgreSQL", role, uid);
            
        } catch (Exception e) {
            logger.error("Erreur lors de la modification du rôle de {}", uid, e);
            throw new RuntimeException("Impossible de modifier le rôle: " + e.getMessage());
        }
    }

    /**
     * Attribuer le rôle initial lors de l'inscription (sans révoquer les tokens)
     * Utilisé pour l'auto-inscription après création du compte Firebase
     * Synchronise également l'utilisateur dans PostgreSQL
     */
    @Transactional
    public void attribuerRoleInitial(String uid, String email, String displayName, Role role) {
        try {
            // Synchroniser dans Firebase (si disponible)
            if (!FirebaseApp.getApps().isEmpty()) {
                try {
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("role", role.name());
                    FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
                    logger.info("Rôle initial {} attribué à l'utilisateur {} dans Firebase", role, uid);
                } catch (FirebaseAuthException e) {
                    logger.warn("Impossible d'attribuer le rôle dans Firebase (peut nécessiter un compte de facturation): {}", e.getMessage());
                    // Continue quand même pour sauvegarder dans PostgreSQL
                }
            }
            
            // Sauvegarder ou mettre à jour dans PostgreSQL
            User user = userRepository.findByUid(uid).orElse(new User());
            user.setUid(uid);
            user.setEmail(email != null ? email : "");
            user.setDisplayName(displayName);
            user.setRole(role);
            user.setDisabled(false);
            if (user.getCreationTime() == null) {
                user.setCreationTime(LocalDateTime.now());
            }
            
            userRepository.save(user);
            logger.info("Utilisateur {} synchronisé dans PostgreSQL avec rôle {}", uid, role);
            
        } catch (Exception e) {
            logger.error("Erreur lors de l'attribution du rôle initial pour {}", uid, e);
            throw new RuntimeException("Impossible d'attribuer le rôle initial: " + e.getMessage());
        }
    }

    /**
     * Convertir un User (PostgreSQL) en UserDTO
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setUid(user.getUid());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setDisabled(user.getDisabled() != null ? user.getDisabled() : false);
        dto.setRole(user.getRole());
        
        // Dates
        if (user.getCreationTime() != null) {
            dto.setCreationTime(String.valueOf(user.getCreationTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()));
        }
        if (user.getLastSignInTime() != null) {
            dto.setLastSignInTime(String.valueOf(user.getLastSignInTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()));
        }
        
        return dto;
    }
}
