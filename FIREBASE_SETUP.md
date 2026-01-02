# 🔥 Configuration Firebase pour Galileo

## ❌ Problème actuel

Vous rencontrez l'erreur : `Firebase: Error (auth/invalid-credential)`

**Cause** : Les credentials Firebase actuels ne sont pas valides ou le projet Firebase n'existe pas/n'est pas configuré correctement.

## ✅ Solution : 3 options

### Option 1 : Créer un nouveau projet Firebase (Recommandé)

1. **Allez sur la Firebase Console** : https://console.firebase.google.com/
2. **Créez un nouveau projet** :
   - Cliquez sur "Ajouter un projet"
   - Nom du projet : `Galileo-Production` (ou votre choix)
   - Suivez les étapes
3. **Ajoutez une application Web** :
   - Dans le projet, cliquez sur l'icône Web `</>`
   - Nom de l'app : `Galileo Frontend`
   - Cochez "Also set up Firebase Hosting" si désiré
4. **Copiez la configuration** :
   ```javascript
   const firebaseConfig = {
     apiKey: "VOTRE_API_KEY",
     authDomain: "votre-projet.firebaseapp.com",
     projectId: "votre-projet",
     storageBucket: "votre-projet.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef..."
   };
   ```
5. **Activez Authentication** :
   - Dans le menu Firebase, allez dans "Authentication"
   - Cliquez sur "Get Started"
   - Activez "Email/Password" dans l'onglet "Sign-in method"
6. **Mettez à jour le fichier `.env`** :
   ```bash
   VITE_FIREBASE_API_KEY=VOTRE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre-projet
   VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
   ```

### Option 2 : Utiliser le mode de développement sans Firebase

Si vous voulez développer sans Firebase temporairement :

1. **Commentez l'authentification Firebase dans `AuthContext.tsx`**
2. **Utilisez un mock d'authentification** (création d'un système de dev local)

### Option 3 : Utiliser Firebase Emulator (pour le développement local)

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser Firebase dans votre projet
firebase init emulators

# Sélectionner Authentication Emulator
# Port par défaut : 9099

# Démarrer l'émulateur
firebase emulators:start
```

Puis dans votre code, ajoutez :
```typescript
import { connectAuthEmulator } from 'firebase/auth';

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## 🔧 Configuration Backend Firebase

Pour le backend (Java Spring Boot), vous devez également configurer Firebase Admin SDK :

1. **Générez une clé privée** :
   - Firebase Console → Project Settings → Service Accounts
   - Cliquez sur "Generate new private key"
   - Téléchargez le fichier JSON

2. **Placez le fichier** :
   ```
   /workspaces/Galileo/backend/config/firebase-credentials.json
   ```

3. **Assurez-vous que le fichier est dans `.gitignore`** (c'est sensible !)

## 🚀 Rebuild après modification

Après avoir mis à jour la configuration Firebase :

```bash
# 1. Reconstruire le frontend
cd /workspaces/Galileo
docker compose build frontend

# 2. Redémarrer le frontend
docker compose up -d frontend

# 3. Vérifier les logs
docker logs galileo-frontend
```

## 📝 Variables d'environnement requises

### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

### Backend (application.yml ou variables d'environnement)
```yaml
firebase:
  project-id: votre-projet
  credentials-path: config/firebase-credentials.json
```

## ⚠️ Important

- **NE JAMAIS** commiter les credentials Firebase dans Git
- Ajoutez `firebase-credentials.json` dans `.gitignore`
- Utilisez des variables d'environnement pour la production
- Les clés API Firebase frontend peuvent être publiques (elles sont restreintes par domaine dans Firebase Console)

## 🔍 Debug

Pour vérifier si Firebase est bien configuré dans le conteneur :

```bash
# Voir les logs du frontend
docker logs galileo-frontend --tail 50

# Inspecter la configuration dans le navigateur
# Ouvrez la console du navigateur et regardez les logs "🔥 Firebase Config"
```

## 📚 Ressources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Admin SDK - Java](https://firebase.google.com/docs/admin/setup)
