package com.galileo.ecriture.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;

/**
 * Garde simple pour vérifier les rôles à partir des en-têtes Gateway.
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
}
