package com.galileo.ecriture.security;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Gestionnaire centralisé des permissions RBAC
 * Définit les permissions pour chaque rôle
 */
public class PermissionManager {
    
    private static final Map<Role, Set<Permission>> ROLE_PERMISSIONS = new EnumMap<>(Role.class);
    
    static {
        // VIEWER - Lecture seule du contenu public
        ROLE_PERMISSIONS.put(Role.VIEWER, Set.of(
            Permission.VIEW_PUBLIC
        ));
        
        // STUDENT - Soumission + lecture de son propre contenu
        ROLE_PERMISSIONS.put(Role.STUDENT, Set.of(
            Permission.VIEW_PUBLIC,
            Permission.VIEW_OWN,
            Permission.SUBMIT,
            Permission.EDIT_OWN_SUBMISSION,
            Permission.DELETE_OWN_SUBMISSION,
            Permission.VIEW_TEAM
        ));
        
        // STAFF - Modération + création de contenu
        ROLE_PERMISSIONS.put(Role.STAFF, Set.of(
            Permission.VIEW_PUBLIC,
            Permission.VIEW_OWN,
            Permission.VIEW_ALL,
            Permission.SUBMIT,
            Permission.EDIT_OWN_SUBMISSION,
            Permission.DELETE_OWN_SUBMISSION,
            Permission.MODERATE,
            Permission.APPROVE_SUBMISSION,
            Permission.REJECT_SUBMISSION,
            Permission.REQUEST_REVISION,
            Permission.CREATE_CONTENT,
            Permission.EDIT_CONTENT,
            Permission.DELETE_CONTENT,
            Permission.PUBLISH_CONTENT,
            Permission.MANAGE_TEAM,
            Permission.VIEW_TEAM,
            Permission.VIEW_STATISTICS
        ));
        
        // ADMIN - Toutes les permissions
        ROLE_PERMISSIONS.put(Role.ADMIN, Set.of(Permission.ALL));
    }
    
    /**
     * Vérifie si un rôle possède une permission spécifique
     */
    public static boolean hasPermission(Role role, Permission permission) {
        if (role == null || permission == null) {
            return false;
        }
        
        Set<Permission> permissions = ROLE_PERMISSIONS.getOrDefault(role, Collections.emptySet());
        
        // Si le rôle a la permission ALL (wildcard), il a toutes les permissions
        if (permissions.contains(Permission.ALL)) {
            return true;
        }
        
        return permissions.contains(permission);
    }
    
    /**
     * Vérifie si un rôle possède au moins une des permissions données
     */
    public static boolean hasAnyPermission(Role role, Permission... permissions) {
        if (role == null || permissions == null || permissions.length == 0) {
            return false;
        }
        
        return Arrays.stream(permissions)
                .anyMatch(p -> hasPermission(role, p));
    }
    
    /**
     * Vérifie si un rôle possède toutes les permissions données
     */
    public static boolean hasAllPermissions(Role role, Permission... permissions) {
        if (role == null || permissions == null || permissions.length == 0) {
            return false;
        }
        
        return Arrays.stream(permissions)
                .allMatch(p -> hasPermission(role, p));
    }
    
    /**
     * Retourne toutes les permissions d'un rôle
     */
    public static Set<Permission> getPermissions(Role role) {
        if (role == null) {
            return Collections.emptySet();
        }
        
        Set<Permission> permissions = ROLE_PERMISSIONS.getOrDefault(role, Collections.emptySet());
        
        // Si le rôle a ALL, retourner toutes les permissions sauf ALL
        if (permissions.contains(Permission.ALL)) {
            return Arrays.stream(Permission.values())
                    .filter(p -> p != Permission.ALL)
                    .collect(Collectors.toSet());
        }
        
        return new HashSet<>(permissions);
    }
    
    /**
     * Retourne les codes de permissions pour un rôle
     */
    public static Set<String> getPermissionCodes(Role role) {
        return getPermissions(role).stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
    }
}
