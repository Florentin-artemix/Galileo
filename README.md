<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Galileo - Revue Scientifique Étudiante

Application complète de gestion de revue scientifique avec frontend React et backend microservices Spring Boot.

View your app in AI Studio: https://ai.studio/apps/drive/1W2M3GsFToDzaY3ZksOyFuDubixdvJ-eb

## 🚀 Déploiement

### Déploiement sur Digital Ocean

**Guide complet étape par étape** : [DIGITAL_OCEAN_DEPLOYMENT.md](./DIGITAL_OCEAN_DEPLOYMENT.md)

Ce guide vous accompagne pour :
- Créer et configurer un Droplet Digital Ocean
- Installer Docker et tous les prérequis
- Configurer le domaine et SSL (HTTPS)
- Déployer l'application complète
- Mettre en place les sauvegardes automatiques
- Sécuriser votre serveur

**Déploiement rapide avec scripts** :
```bash
# 1. Configuration initiale du serveur
bash scripts/setup-server.sh

# 2. Déploiement de l'application
bash scripts/deploy.sh build

# 3. Monitoring
bash scripts/monitor.sh
```

Voir [scripts/README.md](./scripts/README.md) pour la documentation complète des scripts.

### Déploiement avec Docker

**Documentation Docker** : [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

Déploiement local ou sur n'importe quel serveur avec Docker :
```bash
# Démarrer avec Docker Compose
docker compose up -d

# Ou utiliser les images GitHub Container Registry
docker compose -f docker-compose.prod.yml up -d
```

## 💻 Développement Local

**Prerequisites:**  Node.js, Docker (optionnel)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Configure environment variables:
   ```bash
   cp .env.example .env
   nano .env  # Configure your variables
   ```

4. Run the app:
   ```bash
   # Frontend uniquement
   npm run dev
   
   # Stack complète avec Docker
   docker compose up -d
   ```

## 📚 Documentation

- [Guide de déploiement Digital Ocean](./DIGITAL_OCEAN_DEPLOYMENT.md) - Guide complet étape par étape
- [Documentation Docker](./DOCKER_DEPLOYMENT.md) - Déploiement avec Docker et GitHub Container Registry
- [Scripts de gestion](./scripts/README.md) - Scripts bash pour faciliter la gestion
- [Documentation API](./backend/API_DOCUMENTATION.md) - Documentation de l'API REST

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Spring Boot (Microservices)
  - Gateway: API Gateway et authentification
  - Service Lecture: Opérations publiques
  - Service Écriture: Workflow administrateur
- **Bases de données**: PostgreSQL (2 instances)
- **Recherche**: Elasticsearch
- **Authentification**: Firebase
- **Storage**: Cloudflare R2
- **Email**: SendGrid

## 🛠️ Scripts de gestion

- `scripts/setup-server.sh` - Configuration initiale du serveur
- `scripts/deploy.sh` - Déploiement et mise à jour
- `scripts/backup.sh` - Sauvegarde automatique
- `scripts/restore.sh` - Restauration depuis backup
- `scripts/monitor.sh` - Surveillance de l'application

## 📝 License

Projet Galileo - Revue Scientifique Étudiante
