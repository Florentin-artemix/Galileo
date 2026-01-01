package com.galileo.ecriture.controller;

import com.galileo.ecriture.security.Permission;
import com.galileo.ecriture.security.PermissionManager;
import com.galileo.ecriture.security.Role;
import com.galileo.ecriture.security.RoleGuard;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Contrôleur pour obtenir les permissions d'un utilisateur
 * Permet au frontend de savoir ce qu'un utilisateur peut faire
 */
@RestController
@RequestMapping("/users/permissions")
public class PermissionsController {

    private final RoleGuard roleGuard;

    public PermissionsController(RoleGuard roleGuard) {
        this.roleGuard = roleGuard;
    }

    /**
     * GET /api/users/permissions/me - Obtenir mes permissions
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMesPermissions(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        Set<Permission> permissions = roleGuard.getPermissions(role);
        Set<String> permissionCodes = PermissionManager.getPermissionCodes(role);
        
        Map<String, Object> response = new HashMap<>();
        response.put("role", role.name());
        response.put("permissions", permissionCodes);
        response.put("permissionsDetails", permissions.stream()
                .map(p -> Map.of(
                        "code", p.getCode(),
                        "description", p.getDescription()
                ))
                .toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/users/permissions/check/{permission} - Vérifier une permission
     */
    @GetMapping("/check/{permission}")
    public ResponseEntity<Map<String, Object>> verifierPermission(
            @PathVariable String permission,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        
        // Essayer de trouver la permission correspondante
        Permission perm = null;
        try {
            perm = Permission.valueOf(permission.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Permission invalide
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("hasPermission", false);
            return ResponseEntity.ok(errorResult);
        }
        
        boolean hasPermission = roleGuard.hasPermission(role, perm);
        
        Map<String, Object> result = new HashMap<>();
        result.put("permission", permission);
        result.put("hasPermission", hasPermission);
        result.put("role", role.name());
        
        return ResponseEntity.ok(result);
    }
}
