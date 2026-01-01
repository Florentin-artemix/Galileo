# Guide d'Utilisation RBAC - Pour Développeurs

## 🎯 Introduction

Ce guide explique comment utiliser le nouveau système RBAC (Role-Based Access Control) dans vos contrôleurs et services.

## 🔐 Vérification des Permissions

### Méthode 1 : Vérifier une Permission Unique

```java
@RestController
@RequestMapping("/api/publications")
public class PublicationController {
    
    private final RoleGuard roleGuard;
    
    @PostMapping
    public ResponseEntity<Publication> creerPublication(
            @RequestBody PublicationDTO dto,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        
        // Vérifie que l'utilisateur a la permission CREATE_CONTENT
        roleGuard.requirePermission(role, Permission.CREATE_CONTENT);
        
        // Code métier...
        return ResponseEntity.ok(publication);
    }
}
```

### Méthode 2 : Vérifier Plusieurs Permissions (OU logique)

```java
@GetMapping("/{id}")
public ResponseEntity<Publication> getPublication(
        @PathVariable Long id,
        HttpServletRequest request) {
    
    Role role = (Role) request.getAttribute("userRole");
    
    // Vérifie que l'utilisateur a VIEW_PUBLIC OU VIEW_ALL
    roleGuard.requireAnyPermission(role, 
        Permission.VIEW_PUBLIC, 
        Permission.VIEW_ALL
    );
    
    // Code métier...
    return ResponseEntity.ok(publication);
}
```

### Méthode 3 : Vérifier Toutes les Permissions (ET logique)

```java
@PostMapping("/{id}/publish")
public ResponseEntity<Void> publierPublication(
        @PathVariable Long id,
        HttpServletRequest request) {
    
    Role role = (Role) request.getAttribute("userRole");
    
    // Vérifie que l'utilisateur a EDIT_CONTENT ET PUBLISH_CONTENT
    roleGuard.requireAllPermissions(role, 
        Permission.EDIT_CONTENT, 
        Permission.PUBLISH_CONTENT
    );
    
    // Code métier...
    return ResponseEntity.ok().build();
}
```

### Méthode 4 : Vérification Sans Exception

Utilisez `hasPermission()` si vous voulez vérifier sans lever d'exception :

```java
@GetMapping("/{id}")
public ResponseEntity<PublicationDTO> getPublication(
        @PathVariable Long id,
        HttpServletRequest request) {
    
    Role role = (Role) request.getAttribute("userRole");
    String email = (String) request.getAttribute("userEmail");
    
    Publication publication = publicationRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Publication non trouvée"));
    
    // Si l'utilisateur n'a pas VIEW_ALL, vérifier qu'il est l'auteur
    if (!roleGuard.hasPermission(role, Permission.VIEW_ALL)) {
        if (!publication.getAuteurEmail().equals(email)) {
            throw new ForbiddenException("Accès refusé");
        }
    }
    
    return ResponseEntity.ok(convertToDTO(publication));
}
```

## 📝 Audit Logging

### Utilisation Basique

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final AuditService auditService;
    private final RoleGuard roleGuard;
    
    @PostMapping
    public ResponseEntity<User> creerUtilisateur(
            @RequestBody UserDTO dto,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.MANAGE_USERS);
        
        User user = userService.create(dto);
        
        // Logger la création
        auditService.logCreate(request, "USER", user.getId().toString(), user);
        
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> modifierUtilisateur(
            @PathVariable Long id,
            @RequestBody UserDTO dto,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.MANAGE_USERS);
        
        User oldUser = userRepository.findById(id).orElseThrow();
        User newUser = userService.update(id, dto);
        
        // Logger la modification avec l'ancien et le nouveau
        auditService.logUpdate(request, "USER", id.toString(), oldUser, newUser);
        
        return ResponseEntity.ok(newUser);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerUtilisateur(
            @PathVariable Long id,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.MANAGE_USERS);
        
        User user = userRepository.findById(id).orElseThrow();
        userService.delete(id);
        
        // Logger la suppression
        auditService.logDelete(request, "USER", id.toString(), user);
        
        return ResponseEntity.noContent().build();
    }
}
```

### Audit avec Détails Personnalisés

```java
@PostMapping("/{id}/approve")
public ResponseEntity<Soumission> approuverSoumission(
        @PathVariable Long id,
        @RequestBody ApprovalDTO dto,
        HttpServletRequest request) {
    
    Role role = (Role) request.getAttribute("userRole");
    roleGuard.requirePermission(role, Permission.APPROVE_SUBMISSION);
    
    Soumission soumission = soumissionService.approve(id, dto);
    
    // Logger avec détails personnalisés
    Map<String, Object> details = new HashMap<>();
    details.put("soumissionId", id);
    details.put("titre", soumission.getTitre());
    details.put("auteur", soumission.getAuteurEmail());
    details.put("commentaire", dto.getCommentaire());
    details.put("oldStatut", "EN_ATTENTE");
    details.put("newStatut", "ACCEPTEE");
    
    auditService.logAction(request, "APPROVE", "SOUMISSION", id.toString(), details);
    
    return ResponseEntity.ok(soumission);
}
```

## 🔄 Migration d'Anciens Contrôleurs

### Avant (Vérification par Rôle)

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> supprimer(@PathVariable Long id, HttpServletRequest request) {
    Role role = (Role) request.getAttribute("userRole");
    
    // Ancienne méthode - vérification par rôle
    roleGuard.require(role, Role.ADMIN, Role.STAFF);
    
    service.delete(id);
    return ResponseEntity.noContent().build();
}
```

### Après (Vérification par Permission)

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> supprimer(@PathVariable Long id, HttpServletRequest request) {
    Role role = (Role) request.getAttribute("userRole");
    
    // Nouvelle méthode - vérification par permission
    roleGuard.requirePermission(role, Permission.DELETE_CONTENT);
    
    service.delete(id);
    
    // Bonus : Ajouter l'audit logging
    auditService.logDelete(request, "CONTENT", id.toString(), null);
    
    return ResponseEntity.noContent().build();
}
```

## 📋 Liste des Permissions Disponibles

```java
// Lecture
Permission.VIEW_PUBLIC          // Voir contenu public
Permission.VIEW_OWN            // Voir ses propres ressources
Permission.VIEW_ALL            // Voir toutes les ressources
Permission.VIEW_TEAM           // Voir l'équipe
Permission.VIEW_STATISTICS     // Voir les statistiques
Permission.VIEW_AUDIT_LOGS     // Voir les logs d'audit

// Soumissions
Permission.SUBMIT              // Soumettre
Permission.EDIT_OWN_SUBMISSION // Modifier sa soumission
Permission.DELETE_OWN_SUBMISSION // Supprimer sa soumission

// Modération
Permission.MODERATE            // Modérer
Permission.APPROVE_SUBMISSION  // Approuver
Permission.REJECT_SUBMISSION   // Rejeter
Permission.REQUEST_REVISION    // Demander révision

// Contenu (Blog, Événements)
Permission.CREATE_CONTENT      // Créer
Permission.EDIT_CONTENT        // Modifier
Permission.DELETE_CONTENT      // Supprimer
Permission.PUBLISH_CONTENT     // Publier

// Gestion
Permission.MANAGE_TEAM         // Gérer l'équipe
Permission.MANAGE_USERS        // Gérer les utilisateurs
Permission.MANAGE_ROLES        // Gérer les rôles
Permission.MANAGE_SYSTEM       // Gérer le système
Permission.INDEXATION          // Gérer l'indexation

// Wildcard
Permission.ALL                 // Toutes les permissions (ADMIN)
```

## 🎨 Exemples Par Cas d'Usage

### Cas 1 : Resource Publique avec Modération

```java
@GetMapping
public ResponseEntity<List<ArticleDTO>> listerArticles(
        @RequestParam(defaultValue = "false") boolean includeUnpublished,
        HttpServletRequest request) {
    
    // Tout le monde peut voir les articles publiés
    List<Article> articles;
    
    if (includeUnpublished) {
        // Seul STAFF/ADMIN peut voir les non-publiés
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.MODERATE);
        
        articles = articleRepository.findAll();
    } else {
        articles = articleRepository.findByPublieTrue();
    }
    
    return ResponseEntity.ok(articles.stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList()));
}
```

### Cas 2 : Édition Avec Propriété

```java
@PutMapping("/{id}")
public ResponseEntity<SoumissionDTO> modifierSoumission(
        @PathVariable Long id,
        @RequestBody SoumissionDTO dto,
        HttpServletRequest request) {
    
    Role role = (Role) request.getAttribute("userRole");
    String email = (String) request.getAttribute("userEmail");
    
    Soumission soumission = soumissionRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Soumission non trouvée"));
    
    // Si c'est sa propre soumission, vérifier EDIT_OWN_SUBMISSION
    if (soumission.getAuteurEmail().equals(email)) {
        roleGuard.requirePermission(role, Permission.EDIT_OWN_SUBMISSION);
    } 
    // Sinon, vérifier EDIT_CONTENT (STAFF/ADMIN)
    else {
        roleGuard.requirePermission(role, Permission.EDIT_CONTENT);
    }
    
    Soumission updated = soumissionService.update(id, dto);
    auditService.logUpdate(request, "SOUMISSION", id.toString(), soumission, updated);
    
    return ResponseEntity.ok(convertToDTO(updated));
}
```

### Cas 3 : Action Administrative Sensible

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> supprimerUtilisateur(
        @PathVariable Long id,
        HttpServletRequest request) {
    
    Role role = (Role) request.getAttribute("userRole");
    String adminEmail = (String) request.getAttribute("userEmail");
    
    // Vérifier la permission MANAGE_USERS
    roleGuard.requirePermission(role, Permission.MANAGE_USERS);
    
    User user = userRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé"));
    
    // Empêcher l'auto-suppression
    if (user.getEmail().equals(adminEmail)) {
        throw new BadRequestException("Vous ne pouvez pas vous supprimer vous-même");
    }
    
    // Sauvegarder les infos avant suppression pour l'audit
    Map<String, Object> details = new HashMap<>();
    details.put("email", user.getEmail());
    details.put("nom", user.getNom());
    details.put("role", user.getRole());
    
    userService.delete(id);
    
    // Audit logging critique
    auditService.logAction(request, "DELETE", "USER", id.toString(), details);
    
    return ResponseEntity.noContent().build();
}
```

## 🚨 Bonnes Pratiques

### 1. Toujours Vérifier les Permissions

❌ **Mauvais** :
```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> supprimer(@PathVariable Long id) {
    // Pas de vérification !
    service.delete(id);
    return ResponseEntity.noContent().build();
}
```

✅ **Bon** :
```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> supprimer(@PathVariable Long id, HttpServletRequest request) {
    Role role = (Role) request.getAttribute("userRole");
    roleGuard.requirePermission(role, Permission.DELETE_CONTENT);
    
    service.delete(id);
    return ResponseEntity.noContent().build();
}
```

### 2. Logger les Actions Sensibles

Actions à toujours logger :
- ✅ Création d'utilisateur
- ✅ Modification de rôle
- ✅ Suppression de ressources
- ✅ Approbation/Rejet de soumissions
- ✅ Publication de contenu
- ✅ Modifications système

Actions optionnelles :
- Lecture de ressources
- Recherches
- Actions non-destructives

### 3. Utiliser les Bonnes Permissions

❌ **Trop Large** :
```java
// Ne pas donner ALL pour tout
roleGuard.requirePermission(role, Permission.ALL);
```

✅ **Spécifique** :
```java
// Utiliser la permission exacte
roleGuard.requirePermission(role, Permission.APPROVE_SUBMISSION);
```

### 4. Gérer les Cas de Propriété

```java
// Pattern recommandé pour les ressources avec propriétaire
if (resource.getOwnerEmail().equals(userEmail)) {
    roleGuard.requirePermission(role, Permission.EDIT_OWN_SUBMISSION);
} else {
    roleGuard.requirePermission(role, Permission.EDIT_CONTENT);
}
```

## 📚 Ressources

- [RBAC_IMPLEMENTATION.md](RBAC_IMPLEMENTATION.md) - Documentation complète
- [ameliorations_roles_galileo.md](/workspaces/Galileo/ameliorations_roles_galileo.md) - Spécifications d'origine
- [Permission.java](galileo-ecriture/src/main/java/com/galileo/ecriture/security/Permission.java) - Enum des permissions
- [PermissionManager.java](galileo-ecriture/src/main/java/com/galileo/ecriture/security/PermissionManager.java) - Mappings des permissions

---

**Dernière mise à jour** : 2024
**Version** : 1.0
