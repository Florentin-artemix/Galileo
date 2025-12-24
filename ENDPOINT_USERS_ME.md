# Endpoint `/api/admin/users/me` - Documentation

## Description
L'endpoint `GET /api/admin/users/me` permet à tout utilisateur authentifié de récupérer ses propres informations utilisateur, incluant :
- `displayName` : Nom complet (depuis l'enregistrement)
- `program` : Programme d'études / Filière (depuis l'enregistrement)
- `motivation` : Motivation pour rejoindre Galileo (depuis l'enregistrement)
- `email` : Adresse email
- `role` : Rôle de l'utilisateur (ADMIN, STAFF, STUDENT, VIEWER)
- `uid` : Identifiant Firebase
- `creationTime` : Date de création du compte
- `lastSignInTime` : Dernière connexion

## Utilisation dans le Frontend

### 1. Service : `src/services/usersService.ts`
```typescript
import { usersService } from './services/usersService';

// Récupérer les informations de l'utilisateur connecté
const profile = await usersService.getMyProfile();
console.log(profile.program);      // Programme d'études
console.log(profile.motivation);   // Motivation
console.log(profile.displayName);  // Nom complet
```

### 2. Composant : `components/ProfileCard.tsx`
Le composant `ProfileCard` utilise maintenant cet endpoint pour afficher :
- **Programme d'études** : Affiche le programme d'études saisi lors de l'enregistrement
- **Motivation** : Affiche la motivation saisie lors de l'enregistrement
- **Nom complet** : Affiche le nom complet saisi lors de l'enregistrement

**Où le voir :**
- Dans tous les dashboards (Admin, Staff, Student, Viewer)
- Onglet "Mon Profil" (`tab === 'profile'`)

### 3. Exemple d'utilisation dans un composant personnalisé
```typescript
import React, { useEffect, useState } from 'react';
import { usersService, UserDTO } from '../src/services/usersService';

const MyComponent: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserDTO | null>(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const data = await usersService.getMyProfile();
        setUserInfo(data);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    loadUserInfo();
  }, []);

  return (
    <div>
      {userInfo && (
        <>
          <p>Nom : {userInfo.displayName}</p>
          <p>Programme : {userInfo.program}</p>
          <p>Motivation : {userInfo.motivation}</p>
        </>
      )}
    </div>
  );
};
```

## Accès
- **URL** : `GET /api/admin/users/me`
- **Authentification** : Requise (token Firebase)
- **Autorisation** : Tous les utilisateurs authentifiés (pas seulement ADMIN)
- **Headers requis** :
  - `Authorization: Bearer <firebase_token>`
  - `X-User-Id` : Automatiquement ajouté par `apiClient`

## Réponse
```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "displayName": "Nom Complet",
  "program": "Master en Informatique",
  "motivation": "Passionné par la recherche...",
  "role": "STUDENT",
  "creationTime": "1234567890",
  "lastSignInTime": "1234567890",
  "disabled": false
}
```

## Notes
- L'endpoint est accessible via le gateway à `/api/admin/users/me`
- Le gateway ajoute automatiquement les headers `X-User-Id`, `X-User-Email`, `X-User-Role` depuis le token Firebase
- Les données `program` et `motivation` sont stockées lors de l'inscription via `/api/admin/users/self-register`

