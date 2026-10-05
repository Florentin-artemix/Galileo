# GALILEO

Galileo est une plateforme permettant la gestion de ressources et d'innovations pour la Faculté Polytechnique (Université Mapon). 

## Architecture (Galileo v3)
L'application suit une architecture de monolithe modulaire :
- **Frontend** : React + TypeScript + Vite
- **Backend** : Spring Boot 3.3.4 (Java 21), Maven
- **Base de données** : PostgreSQL + pgvector + Flyway
- **Stockage** : Cloudflare R2
- **IA** : DeepSeek API (LLM) et Qwen text-embedding-v4 (Embeddings)
- **Sécurité** : Spring Security + JWT
- **Déploiement** : Java/JAR sur Heroku

## Installation et Utilisation

### Variables d'environnement
Copiez le fichier `.env.example` en `.env` à la racine du projet et configurez les variables nécessaires (Frontend, Base de données, JWT, Cloudflare R2, DeepSeek, Qwen). Ne commitez jamais vos clés secrètes.

### Frontend
1. Assurez-vous d'avoir Node.js installé (version 20+ recommandée).
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

### Backend
1. Assurez-vous d'avoir Java 21 d'installé.
2. Déplacez-vous dans le dossier backend :
   ```bash
   cd backend
   ```
3. Compilez et exécutez avec Maven Wrapper :
   ```bash
   ./mvnw clean package
   ./mvnw spring-boot:run
   ```
