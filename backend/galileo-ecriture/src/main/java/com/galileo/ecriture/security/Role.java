package com.galileo.ecriture.security;

/**
 * Rôles supportés par le service d'écriture.
 */
public enum Role {
    ADMIN,
    STAFF,
    STUDENT,
    VIEWER;

    /**
     * Convertit la valeur d'en-tête brute en rôle.
     * Accepte quelques alias pour faciliter l'intégration côté gateway.
     */
    public static Role fromHeader(String raw) {
        if (raw == null || raw.isBlank()) {
            return VIEWER;
        }
        String value = raw.trim().toUpperCase();
        return switch (value) {
            case "ADMIN" -> ADMIN;
            case "STAFF", "PERSONNEL", "EMPLOYEE" -> STAFF;
            case "STUDENT", "ETUDIANT", "ETUDIANT", "STAGIAIRE" -> STUDENT;
            case "VIEWER", "READONLY", "LECTEUR" -> VIEWER;
            default -> VIEWER;
        };
    }
}
