# Harmonisation Frontend/Backend - Système RBAC

## Vue d'ensemble

Ce document décrit l'harmonisation entre le système RBAC backend (Permission-based) et le frontend React.

## Fichiers créés/modifiés

### Nouveaux fichiers Frontend

1. **`src/services/permissionsService.ts`** - Service API pour les permissions
   - `getMyPermissions()` - Récupère role + permissions de l'utilisateur
   - `checkPermission(permission)` - Vérifie une permission spécifique
   - `checkAllPermissions(permissions[])` - Vérifie toutes les permissions (AND)
   - `checkAnyPermission(permissions[])` - Vérifie au moins une permission (OR)

2. **`src/constants/permissions.ts`** - Constantes des permissions
   - Synchronisé avec `backend/galileo-ecriture/src/main/java/com/galileo/ecriture/security/Permission.java`
   - 22 permissions définies (VIEW_PUBLIC, SUBMIT, MODERATE, MANAGE_BLOG, etc.)

3. **`components/PermissionGuard.tsx`** - Composant de protection basé sur permissions
   - Remplace progressivement `RequireRole` 
   - Supporte `required` (AND), `anyOf` (OR), `fallback`
   
4. **`hooks/usePermissions.ts`** - Hook personnalisé pour les permissions
   - Charge les permissions au montage du composant
   - Fournit `hasPermission(permission, requireAll)` pour vérifications inline

## Backend RBAC - Endpoints disponibles

### 1. Récupérer les permissions de l'utilisateur
```
GET /api/users/permissions/me
Headers: Authorization: Bearer <firebase_token>
```
Réponse :
```json
{
  "role": "STUDENT",
  "permissions": [
    "VIEW_PUBLIC",
    "VIEW_OWN",
    "SUBMIT",
    "EDIT_OWN_SUBMISSION",
    "DELETE_OWN_SUBMISSION",
    "VIEW_TEAM"
  ]
}
```

### 2. Vérifier une permission
```
GET /api/users/permissions/check/{permission}
Headers: Authorization: Bearer <firebase_token>
```
Réponse :
```json
{
  "hasPermission": true
}
```

## Exemples d'utilisation Frontend

### 1. Utiliser `PermissionGuard` pour protéger une route

```tsx
import PermissionGuard from './components/PermissionGuard';
import { PERMISSIONS } from './src/constants/permissions';

// Protéger une page avec une permission
<Route
  path="/submit"
  element={
    <PermissionGuard required={PERMISSIONS.SUBMIT}>
      <SubmissionPage />
    </PermissionGuard>
  }
/>

// Protéger avec plusieurs permissions (toutes requises)
<Route
  path="/moderation"
  element={
    <PermissionGuard required={[PERMISSIONS.MODERATE, PERMISSIONS.APPROVE_SUBMISSION]}>
      <ModerationPage />
    </PermissionGuard>
  }
/>

// Protéger avec au moins une permission
<Route
  path="/content-management"
  element={
    <PermissionGuard anyOf={[PERMISSIONS.MANAGE_BLOG, PERMISSIONS.MANAGE_EVENTS]}>
      <ContentManagementPage />
    </PermissionGuard>
  }
/>
```

### 2. Utiliser `usePermissions` pour affichage conditionnel

```tsx
import { usePermissions } from './hooks/usePermissions';
import { PERMISSIONS } from './src/constants/permissions';

const Dashboard: React.FC = () => {
  const { hasPermission, role, loading } = usePermissions();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Dashboard {role}</h1>
      
      {/* Afficher le bouton uniquement si l'utilisateur a la permission */}
      {hasPermission(PERMISSIONS.SUBMIT) && (
        <button>Soumettre un article</button>
      )}
      
      {/* Afficher si au moins une permission (OR) */}
      {hasPermission([PERMISSIONS.MANAGE_BLOG, PERMISSIONS.MANAGE_EVENTS], false) && (
        <button>Gérer le contenu</button>
      )}
      
      {/* Afficher si toutes les permissions (AND) */}
      {hasPermission([PERMISSIONS.MODERATE, PERMISSIONS.APPROVE_SUBMISSION], true) && (
        <button>Approuver les soumissions</button>
      )}
    </div>
  );
};
```

### 3. Vérifier les permissions de manière asynchrone

```tsx
import { permissionsService } from './src/services/permissionsService';
import { PERMISSIONS } from './src/constants/permissions';

const handleAction = async () => {
  const canSubmit = await permissionsService.checkPermission(PERMISSIONS.SUBMIT);
  
  if (canSubmit) {
    // Effectuer l'action
  } else {
    alert('Vous n\'avez pas la permission de soumettre');
  }
};
```

## Migration progressive de `RequireRole` vers `PermissionGuard`

### Avant (Role-based)
```tsx
<RequireRole allowed={['STUDENT', 'ADMIN', 'STAFF']}>
  <SubmissionPage />
</RequireRole>
```

### Après (Permission-based)
```tsx
<PermissionGuard required={PERMISSIONS.SUBMIT}>
  <SubmissionPage />
</PermissionGuard>
```

**Avantages :**
- Plus granulaire (une permission spécifique au lieu d'un rôle général)
- Plus flexible (combinaison de permissions avec AND/OR)
- Plus maintenable (ajout de permissions sans changer les rôles)

## Matrice de permissions par rôle

| Permission | VIEWER | STUDENT | STAFF | ADMIN |
|-----------|--------|---------|-------|-------|
| VIEW_PUBLIC | ✅ | ✅ | ✅ | ✅ |
| VIEW_OWN | ❌ | ✅ | ✅ | ✅ |
| SUBMIT | ❌ | ✅ | ✅ | ✅ |
| MODERATE | ❌ | ❌ | ✅ | ✅ |
| APPROVE_SUBMISSION | ❌ | ❌ | ✅ | ✅ |
| MANAGE_BLOG | ❌ | ❌ | ✅ | ✅ |
| MANAGE_USERS | ❌ | ❌ | ❌ | ✅ |
| VIEW_AUDIT_LOGS | ❌ | ❌ | ❌ | ✅ |
| MANAGE_SYSTEM | ❌ | ❌ | ❌ | ✅ |

## Pages actuellement PUBLIC (sans authentification)

- `/` - HomePage
- `/about` - AboutPage
- `/team` - TeamPage
- `/publications` - PublicationsPage
- `/publication/:id` - SinglePublicationPage
- **`/blog`** - BlogPage (✅ PUBLIC)
- **`/blog/:id`** - SingleBlogPostPage (✅ PUBLIC)
- `/events` - EventsPage
- `/auth` - AuthPage
- `/contact` - ContactPage
- `/resources` - ResourcesPage

## Pages protégées par rôles (à migrer vers permissions)

| Route | Protection actuelle | Migration vers permission |
|-------|-------------------|--------------------------|
| `/submit` | STUDENT, ADMIN, STAFF | `PERMISSIONS.SUBMIT` |
| `/dashboard/admin` | ADMIN, STAFF | `PERMISSIONS.VIEW_USERS` ou `PERMISSIONS.MANAGE_SYSTEM` |
| `/dashboard/student` | STUDENT, ADMIN, STAFF | `PERMISSIONS.VIEW_OWN` |
| `/dashboard/staff` | STAFF, ADMIN | `PERMISSIONS.MODERATE` |
| `/dashboard/viewer` | VIEWER, STUDENT, STAFF, ADMIN | `PERMISSIONS.VIEW_PUBLIC` |

## Prochaines étapes

1. ✅ Backend RBAC complet (Permission.java, PermissionManager, RoleGuard, Controllers)
2. ✅ Frontend services (permissionsService, constants/permissions)
3. ✅ Frontend composants (PermissionGuard, usePermissions hook)
4. ⏳ Rebuild frontend Docker avec nouvelles fonctionnalités
5. ⏳ Tester les permissions via l'interface utilisateur
6. ⏳ Migrer progressivement RequireRole → PermissionGuard
7. ⏳ Ajouter affichage conditionnel dans dashboards basé sur permissions

## Testing

### Backend
```bash
cd backend
curl -X GET http://localhost:8080/api/users/permissions/me \
  -H "Authorization: Bearer <firebase_token>"
```

### Frontend
1. Se connecter avec un utilisateur STUDENT
2. Vérifier dans la console : `window.localStorage` pour voir le token
3. Naviguer vers `/submit` - doit être accessible
4. Naviguer vers `/dashboard/admin` - doit être refusé

## Notes importantes

- Le blog (`/blog`, `/blog/:id`) est **PUBLIC** et ne nécessite AUCUNE authentification
- Les images de blog sont affichées via `urlImagePrincipale` du DTO
- Le CSS responsive est configuré avec `overflow-x-hidden` et `break-words`
- La page de détail `SingleBlogPostPage` existe et fonctionne
- Les nouveaux services sont prêts mais nécessitent un rebuild Docker du frontend

## Synchronisation Backend/Frontend

**Backend Permission enum** ↔️ **Frontend PERMISSIONS constant**

Toute modification dans `Permission.java` doit être reflétée dans `permissions.ts` pour maintenir la cohérence.
