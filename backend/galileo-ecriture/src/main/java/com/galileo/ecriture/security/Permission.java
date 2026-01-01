package com.galileo.ecriture.security;

/**
 * Permissions granulaires du système Galileo
 * Utilisées pour définir ce que chaque rôle peut faire
 */
public enum Permission {
    // Permissions de lecture
    VIEW_PUBLIC("view_public", "Voir le contenu public"),
    VIEW_OWN("view_own", "Voir son propre contenu"),
    VIEW_ALL("view_all", "Voir tout le contenu"),
    
    // Permissions de soumission
    SUBMIT("submit", "Soumettre du contenu"),
    EDIT_OWN_SUBMISSION("edit_own_submission", "Modifier ses propres soumissions"),
    DELETE_OWN_SUBMISSION("delete_own_submission", "Supprimer ses propres soumissions"),
    
    // Permissions de modération
    MODERATE("moderate", "Modérer les soumissions"),
    APPROVE_SUBMISSION("approve_submission", "Approuver les soumissions"),
    REJECT_SUBMISSION("reject_submission", "Rejeter les soumissions"),
    REQUEST_REVISION("request_revision", "Demander des révisions"),
    
    // Permissions de gestion de contenu
    CREATE_CONTENT("create_content", "Créer du contenu (blog, événements)"),
    EDIT_CONTENT("edit_content", "Modifier le contenu"),
    DELETE_CONTENT("delete_content", "Supprimer le contenu"),
    PUBLISH_CONTENT("publish_content", "Publier du contenu"),
    
    // Permissions de gestion d'équipe
    MANAGE_TEAM("manage_team", "Gérer l'équipe"),
    VIEW_TEAM("view_team", "Voir l'équipe"),
    
    // Permissions d'administration
    MANAGE_USERS("manage_users", "Gérer les utilisateurs"),
    MANAGE_ROLES("manage_roles", "Gérer les rôles"),
    VIEW_AUDIT_LOGS("view_audit_logs", "Voir les logs d'audit"),
    VIEW_STATISTICS("view_statistics", "Voir les statistiques"),
    
    // Permissions système
    MANAGE_SYSTEM("manage_system", "Gérer le système"),
    INDEXATION("indexation", "Effectuer l'indexation"),
    
    // Wildcard
    ALL("*", "Toutes les permissions");
    
    private final String code;
    private final String description;
    
    Permission(String code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
}
