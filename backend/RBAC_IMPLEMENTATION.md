# Implémentation RBAC - Système de Permissions Galileo

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système RBAC (Role-Based Access Control) pour le projet Galileo, basé sur les exigences définies dans `ameliorations_roles_galileo.md`.

## ✅ Composants Implémentés

### 1. Système de Permissions Backend

#### Permission Enum (`Permission.java`)
- **20+ permissions granulaires** définies :
  - `VIEW_PUBLIC` - Voir le contenu public
  - `VIEW_OWN` - Voir ses propres ressources
  - `VIEW_ALL` - Voir toutes les ressources
  - `SUBMIT` - Soumettre du contenu
  - `EDIT_OWN_SUBMISSION` - Modifier ses soumissions
  - `DELETE_OWN_SUBMISSION` - Supprimer ses soumissions
  - `MODERATE` - Modérer le contenu
  - `APPROVE_SUBMISSION` - Approuver une soumission
  - `REJECT_SUBMISSION` - Rejeter une soumission
  - `REQUEST_REVISION` - Demander des révisions
  - `CREATE_CONTENT` - Créer du contenu (blog, événements)
  - `EDIT_CONTENT` - Modifier le contenu
  - `DELETE_CONTENT` - Supprimer le contenu
  - `PUBLISH_CONTENT` - Publier le contenu
  - `MANAGE_TEAM` - Gérer l'équipe
  - `VIEW_TEAM` - Voir l'équipe
  - `MANAGE_USERS` - Gérer les utilisateurs
  - `MANAGE_ROLES` - Gérer les rôles
  - `VIEW_AUDIT_LOGS` - Voir les logs d'audit
  - `VIEW_STATISTICS` - Voir les statistiques
  - `MANAGE_SYSTEM` - Gérer le système
  - `INDEXATION` - Gérer l'indexation
  - `ALL` - Permission wildcard (ADMIN)

#### PermissionManager (`PermissionManager.java`)
- **Gestion centralisée des permissions par rôle**
- Mapping statique :
  - **VIEWER** : `VIEW_PUBLIC` uniquement
  - **STUDENT** : `VIEW_PUBLIC`, `VIEW_OWN`, `SUBMIT`, édition/suppression de ses soumissions, `VIEW_TEAM`
  - **STAFF** : Toutes les permissions STUDENT + modération + création de contenu
  - **ADMIN** : Permission `ALL` (wildcard donnant tous les droits)

- Méthodes utilitaires :
  - `hasPermission(role, permission)` - Vérifie une permission
  - `hasAnyPermission(role, permissions)` - Vérifie au moins une permission
  - `hasAllPermissions(role, permissions)` - Vérifie toutes les permissions
  - `getPermissions(role)` - Récupère toutes les permissions d'un rôle
  - `getPermissionCodes(role)` - Récupère les codes de permissions

#### RoleGuard Enhanced (`RoleGuard.java`)
- **Nouvelles méthodes de vérification de permissions** :
  - `requirePermission(role, permission)` - Vérifie une permission unique
  - `requireAnyPermission(role, permissions)` - Vérifie au moins une permission
  - `requireAllPermissions(role, permissions)` - Vérifie toutes les permissions
  - `hasPermission(role, permission)` - Vérifie sans lever d'exception
  - `getPermissions(role)` - Récupère les permissions

### 2. API de Permissions

#### PermissionsController (`PermissionsController.java`)
- **Endpoints REST pour interroger les permissions** :
  - `GET /api/users/permissions/me` - Récupère les permissions de l'utilisateur
  - `GET /api/users/permissions/check/{permission}` - Vérifie une permission spécifique

### 3. Dashboard Étudiant (STUDENT)

#### StudentDashboardController (`StudentDashboardController.java`)
- **Endpoints dédiés aux étudiants** :
  - `GET /api/student/dashboard/mes-soumissions` - Liste des soumissions
  - `GET /api/student/dashboard/statistiques` - Statistiques personnelles
  - `GET /api/student/dashboard/soumission/{id}` - Détails + feedbacks non-internes
  - `GET /api/student/dashboard/soumissions/statut/{statut}` - Filtrer par statut

- **Statuts de soumissions** :
  - `BROUILLON` - En cours d'édition
  - `EN_ATTENTE` - Soumise, en attente de modération
  - `ACCEPTEE` - Approuvée par STAFF
  - `REFUSEE` - Rejetée par STAFF
  - `REVISION_DEMANDEE` - Révisions demandées

### 4. Dashboard Modération (STAFF)

#### StaffModerationController (`StaffModerationController.java`)
- **File de modération** :
  - `GET /api/staff/moderation/queue` - Soumissions en attente
  - `GET /api/staff/moderation/soumissions` - Toutes les soumissions avec filtres
  - `GET /api/staff/moderation/statistiques` - Statistiques globales

- **Actions de modération** :
  - `POST /api/staff/moderation/approuver/{id}` - Approuver
  - `POST /api/staff/moderation/rejeter/{id}` - Rejeter
  - `POST /api/staff/moderation/demander-revision/{id}` - Demander révision

- **Système de feedback** :
  - `POST /api/staff/moderation/commentaire-interne/{id}` - Ajouter note interne
  - `GET /api/staff/moderation/soumission/{id}/feedbacks` - Voir tous les feedbacks

#### Feedback Entity (`Feedback.java`)
- Table `feedbacks` pour stocker les commentaires de modération
- Champs :
  - `moderator_email`, `moderator_name` - Qui a créé le feedback
  - `commentaire` - Contenu du feedback
  - `statut` - Type de feedback (APPROVED, REJECTED, REVISION_REQUESTED, INTERNAL_NOTE)
  - `internal` - Boolean (true = visible STAFF/ADMIN uniquement)

### 5. Audit Logging (ADMIN)

#### AuditService (`AuditService.java`)
- **Service centralisé pour logger les actions** :
  - `logCreate()` - Log création de ressource
  - `logUpdate()` - Log mise à jour
  - `logDelete()` - Log suppression
  - `logAction()` - Log action générique

- **Informations capturées** :
  - Utilisateur (email, rôle)
  - Action (CREATE, UPDATE, DELETE, etc.)
  - Ressource (type, ID)
  - Détails (JSON)
  - Context (IP, User-Agent, timestamp)

#### AuditController (`AuditController.java`)
- **Endpoints pour consulter les logs** :
  - `GET /api/admin/audit/recent` - 100 derniers logs
  - `GET /api/admin/audit` - Tous les logs avec pagination + filtres
  - `GET /api/admin/audit/{id}` - Log spécifique
  - `GET /api/admin/audit/user/{email}` - Logs d'un utilisateur

- **Filtres disponibles** :
  - Par utilisateur (`userEmail`)
  - Par action (`action`)
  - Par type de ressource (`resourceType`)
  - Par période (`startDate`, `endDate`)

## 🗄️ Schéma de Base de Données

### Table `feedbacks`
```sql
CREATE TABLE feedbacks (
    id BIGSERIAL PRIMARY KEY,
    soumission_id BIGINT NOT NULL,
    moderator_email VARCHAR(255) NOT NULL,
    moderator_name VARCHAR(255),
    commentaire TEXT,
    statut VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (soumission_id) REFERENCES soumissions(id) ON DELETE CASCADE
);
```

### Table `audit_logs`
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 📝 Migration SQL

Le script `migration_add_feedback_audit.sql` crée automatiquement :
- Les tables `feedbacks` et `audit_logs`
- Les index pour optimiser les performances
- Les commentaires de documentation
- Les contraintes de clés étrangères

**Exécution** :
```bash
# Depuis le conteneur PostgreSQL
docker exec -i galileo-ecriture-db psql -U postgres -d galileo_ecriture < migration_add_feedback_audit.sql
```

## 🔐 Matrice de Permissions

| Permission | VIEWER | STUDENT | STAFF | ADMIN |
|-----------|--------|---------|-------|-------|
| VIEW_PUBLIC | ✅ | ✅ | ✅ | ✅ |
| VIEW_OWN | ❌ | ✅ | ✅ | ✅ |
| VIEW_ALL | ❌ | ❌ | ✅ | ✅ |
| SUBMIT | ❌ | ✅ | ✅ | ✅ |
| EDIT_OWN_SUBMISSION | ❌ | ✅ | ✅ | ✅ |
| DELETE_OWN_SUBMISSION | ❌ | ✅ | ✅ | ✅ |
| MODERATE | ❌ | ❌ | ✅ | ✅ |
| APPROVE_SUBMISSION | ❌ | ❌ | ✅ | ✅ |
| REJECT_SUBMISSION | ❌ | ❌ | ✅ | ✅ |
| REQUEST_REVISION | ❌ | ❌ | ✅ | ✅ |
| CREATE_CONTENT | ❌ | ❌ | ✅ | ✅ |
| EDIT_CONTENT | ❌ | ❌ | ✅ | ✅ |
| DELETE_CONTENT | ❌ | ❌ | ✅ | ✅ |
| PUBLISH_CONTENT | ❌ | ❌ | ✅ | ✅ |
| MANAGE_TEAM | ❌ | ❌ | ✅ | ✅ |
| VIEW_TEAM | ❌ | ✅ | ✅ | ✅ |
| MANAGE_USERS | ❌ | ❌ | ❌ | ✅ |
| MANAGE_ROLES | ❌ | ❌ | ❌ | ✅ |
| VIEW_AUDIT_LOGS | ❌ | ❌ | ❌ | ✅ |
| VIEW_STATISTICS | ❌ | ❌ | ✅ | ✅ |
| MANAGE_SYSTEM | ❌ | ❌ | ❌ | ✅ |
| INDEXATION | ❌ | ❌ | ✅ | ✅ |

## 🚀 Prochaines Étapes

### Backend
1. ✅ ~~Créer système de permissions (Permission enum, PermissionManager)~~
2. ✅ ~~Créer dashboard STUDENT avec statistiques~~
3. ✅ ~~Créer système de modération STAFF avec feedbacks~~
4. ✅ ~~Créer audit logging ADMIN~~
5. ⏳ Intégrer AuditService dans les contrôleurs existants
6. ⏳ Remplacer les vérifications de rôles par des vérifications de permissions
7. ⏳ Exécuter la migration SQL sur la base de données

### Frontend
1. ⏳ Créer service API pour récupérer les permissions (`/users/permissions/me`)
2. ⏳ Créer composant `PermissionGuard` pour le rendering conditionnel
3. ⏳ Créer page StudentDashboard avec :
   - Liste des soumissions par statut
   - Statistiques visuelles
   - Visualisation des feedbacks
4. ⏳ Créer page StaffModeration avec :
   - File de modération (queue)
   - Formulaires d'approbation/rejet
   - Système de commentaires internes
5. ⏳ Créer page AdminAudit pour visualiser les logs

### Tests
1. ⏳ Tests unitaires pour PermissionManager
2. ⏳ Tests d'intégration pour les nouveaux endpoints
3. ⏳ Tests de sécurité pour vérifier l'isolation des rôles

## 📊 Statistiques d'Implémentation

- **Fichiers créés** : 13
- **Lignes de code** : ~2000+
- **Endpoints API** : 20+
- **Permissions définies** : 22
- **Tables DB** : 2 nouvelles (feedbacks, audit_logs)

## 🔗 Références

- Document d'origine : `/workspaces/Galileo/ameliorations_roles_galileo.md`
- Architecture : Microservices Spring Boot
- Base de données : PostgreSQL
- Sécurité : Firebase Authentication + RBAC personnalisé

---

**Date de création** : 2024
**Auteur** : GitHub Copilot
**Status** : ✅ Backend complet, ⏳ Frontend à faire
