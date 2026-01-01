package com.galileo.ecriture.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Set;

/**
 * Garde pour vérifier les rôles et permissions à partir des en-têtes Gateway.
 * Gère à la fois la vérification par rôle (legacy) et par permission (RBAC).
 */
@Component
public class RoleGuard {

    /**
     * Extrait le rôle depuis l'en-tête X-User-Role, avec VIEWER comme valeur par défaut.
     */
    public Role resolveRole(String roleHeader) {
        return Role.fromHeader(roleHeader);
    }

    /**
     * Vérifie que le rôle courant fait partie des rôles autorisés.
     */
    public void require(Role role, Role... allowed) {
        boolean ok = Arrays.stream(allowed).anyMatch(r -> r == role);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Accès refusé pour le rôle " + role);
        }
    }
    
    /**
     * Vérifie qu'un rôle possède une permission spécifique.
     * Utilise le système RBAC centralisé.
     */
    public void requirePermission(Role role, Permission permission) {
        if (!PermissionManager.hasPermission(role, permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Permission refusée : " + permission.getDescription() + " (rôle actuel : " + role + ")");
        }
    }
    
    /**
     * Vérifie qu'un rôle possède au moins une des permissions données.
     */
    public void requireAnyPermission(Role role, Permission... permissions) {
        if (!PermissionManager.hasAnyPermission(role, permissions)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Aucune des permissions requises n'est accordée au rôle " + role);
        }
    }
    
    /**
     * Vérifie qu'un rôle possède toutes les permissions données.
     */
    public void requireAllPermissions(Role role, Permission... permissions) {
        if (!PermissionManager.hasAllPermissions(role, permissions)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Toutes les permissions requises ne sont pas accordées au rôle " + role);
        }
    }
    
    /**
     * Retourne toutes les permissions d'un rôle.
     */
    public Set<Permission> getPermissions(Role role) {
        return PermissionManager.getPermissions(role);
    }
    
    /**
     * Vérifie si un rôle possède une permission.
     */
    public boolean hasPermission(Role role, Permission permission) {
        return PermissionManager.hasPermission(role, permission);
    }
}
