# 🐳 Guide de Déploiement Docker - Projet Galileo

## 📋 Table des matières
- [Images Docker](#images-docker)
- [GitHub Container Registry](#github-container-registry)
- [Déploiement Automatique](#déploiement-automatique)
- [Utilisation Locale](#utilisation-locale)
- [Configuration](#configuration)

## 🎯 Images Docker

Le projet Galileo comprend **4 images Docker** :

### 1. Frontend (React + Vite)
- **Image** : `ghcr.io/{owner}/galileo-frontend`
- **Port** : 80 (Nginx)
- **Taille** : ~50MB (multi-stage build avec Alpine)
- **Base** : node:20-alpine → nginx:alpine

### 2. Backend Gateway (Spring Boot)
- **Image** : `ghcr.io/{owner}/galileo-gateway`
- **Port** : 8080
- **Rôle** : API Gateway, routage des requêtes, authentification Firebase

### 3. Backend Lecture (Spring Boot)
- **Image** : `ghcr.io/{owner}/galileo-lecture`
- **Port** : 8081
- **Rôle** : Service de lecture (opérations publiques), intégration Elasticsearch

### 4. Backend Écriture (Spring Boot)
- **Image** : `ghcr.io/{owner}/galileo-ecriture`
- **Port** : 8082
- **Rôle** : Service d'écriture (workflow admin), gestion Firebase

## 🚀 GitHub Container Registry

### Configuration initiale

Les images Docker sont automatiquement publiées sur **GitHub Container Registry (ghcr.io)** via GitHub Actions.

#### Étape 1 : Activer GitHub Container Registry

1. Accédez aux paramètres de votre repository GitHub
2. Allez dans **Settings** → **Actions** → **General**
3. Dans **Workflow permissions**, sélectionnez :
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
4. Cliquez sur **Save**

#### Étape 2 : Vérifier le workflow

Le workflow `.github/workflows/docker-publish.yml` est automatiquement déclenché lors :
- De push sur les branches `main` et `develop`
- De création de tags `v*.*.*` (ex: v1.0.0)
- De pull requests vers `main`
- Manuellement via "Actions" → "Run workflow"

### Visibilité des images

Par défaut, les images sont **privées**. Pour les rendre publiques :

1. Accédez à votre profil GitHub → **Packages**
2. Sélectionnez l'image (ex: `galileo-frontend`)
3. **Package settings** → **Change visibility** → **Public**

## ⚙️ Déploiement Automatique

### Déclencheurs du workflow

```yaml
# Push sur main ou develop
git push origin main

# Création d'un tag de version
git tag v1.0.0
git push origin v1.0.0

# Pull request vers main
# → Build uniquement (pas de push)
```

### Tags d'images générés

Pour chaque build, plusieurs tags sont créés :

```bash
# Branche
ghcr.io/{owner}/galileo-frontend:main
ghcr.io/{owner}/galileo-frontend:develop

# Version sémantique (si tag v1.2.3)
ghcr.io/{owner}/galileo-frontend:1.2.3
ghcr.io/{owner}/galileo-frontend:1.2
ghcr.io/{owner}/galileo-frontend:1

# SHA du commit
ghcr.io/{owner}/galileo-frontend:main-abc123d

# Latest (branche par défaut uniquement)
ghcr.io/{owner}/galileo-frontend:latest
```

## 💻 Utilisation Locale

### Option 1 : Build local

```bash
# Frontend
docker build -t galileo-frontend .

# Backend services
docker build -t galileo-gateway ./backend/galileo-gateway
docker build -t galileo-lecture ./backend/galileo-lecture
docker build -t galileo-ecriture ./backend/galileo-ecriture
```

### Option 2 : Utiliser les images GitHub

Créez un fichier `docker-compose.prod.yml` :

```yaml
version: '3.8'

services:
  frontend:
    image: ghcr.io/{owner}/galileo-frontend:latest
    ports:
      - "3000:80"
    depends_on:
      - gateway

  gateway:
    image: ghcr.io/{owner}/galileo-gateway:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - LECTURE_SERVICE_URL=http://lecture:8081
      - ECRITURE_SERVICE_URL=http://ecriture:8082
    depends_on:
      - lecture
      - ecriture

  lecture:
    image: ghcr.io/{owner}/galileo-lecture:latest
    ports:
      - "8081:8081"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db-lecture:5432/db_galileo_lecture
      - SPRING_DATASOURCE_USERNAME=galileo_user
      - SPRING_DATASOURCE_PASSWORD=galileo_pass_2025
      - ELASTICSEARCH_HOST=elasticsearch
      - ELASTICSEARCH_PORT=9200

  ecriture:
    image: ghcr.io/{owner}/galileo-ecriture:latest
    ports:
      - "8082:8082"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db-ecriture:5432/db_galileo_ecriture
      - SPRING_DATASOURCE_USERNAME=galileo_user
      - SPRING_DATASOURCE_PASSWORD=galileo_pass_2025

  # Bases de données et Elasticsearch (inchangées)
  db-lecture:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: db_galileo_lecture
      POSTGRES_USER: galileo_user
      POSTGRES_PASSWORD: galileo_pass_2025
    volumes:
      - postgres-lecture-data:/var/lib/postgresql/data

  db-ecriture:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: db_galileo_ecriture
      POSTGRES_USER: galileo_user
      POSTGRES_PASSWORD: galileo_pass_2025
    volumes:
      - postgres-ecriture-data:/var/lib/postgresql/data

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

volumes:
  postgres-lecture-data:
  postgres-ecriture-data:
  elasticsearch-data:

networks:
  default:
    name: galileo-network
```

### Lancer l'application

```bash
# Avec images locales
docker-compose up -d

# Avec images GitHub (images publiques)
docker-compose -f docker-compose.prod.yml up -d

# Avec images GitHub (images privées)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` pour la configuration :

```bash
# Database Lecture
DB_LECTURE_HOST=db-lecture
DB_LECTURE_PORT=5432
DB_LECTURE_NAME=db_galileo_lecture
DB_LECTURE_USER=galileo_user
DB_LECTURE_PASSWORD=galileo_pass_2025

# Database Écriture
DB_ECRITURE_HOST=db-ecriture
DB_ECRITURE_PORT=5432
DB_ECRITURE_NAME=db_galileo_ecriture
DB_ECRITURE_USER=galileo_user
DB_ECRITURE_PASSWORD=galileo_pass_2025

# Elasticsearch
ELASTICSEARCH_HOST=elasticsearch
ELASTICSEARCH_PORT=9200

# Services URLs
LECTURE_SERVICE_URL=http://lecture:8081
ECRITURE_SERVICE_URL=http://ecriture:8082
```

### Secrets Firebase

Pour les services nécessitant Firebase :

```bash
# Créer le dossier config
mkdir -p backend/config

# Placer le fichier de credentials
cp /path/to/firebase-credentials.json backend/config/
```

## 📊 Monitoring

### Vérifier les images

```bash
# Lister les images GitHub
docker images | grep ghcr.io

# Informations détaillées
docker image inspect ghcr.io/{owner}/galileo-frontend:latest
```

### Vérifier les conteneurs

```bash
# Status des conteneurs
docker-compose ps

# Logs
docker-compose logs -f frontend
docker-compose logs -f gateway
docker-compose logs -f lecture
docker-compose logs -f ecriture

# Health checks
curl http://localhost:3000              # Frontend
curl http://localhost:8080/actuator/health  # Gateway
curl http://localhost:8081/actuator/health  # Lecture
curl http://localhost:8082/actuator/health  # Écriture
```

## 🔄 Mise à jour des images

### Automatique (via GitHub Actions)

```bash
# Créer une nouvelle version
git tag v1.1.0
git push origin v1.1.0

# Les images sont automatiquement buildées et publiées
```

### Manuel

```bash
# Pull des nouvelles images
docker-compose -f docker-compose.prod.yml pull

# Redémarrage avec les nouvelles images
docker-compose -f docker-compose.prod.yml up -d
```

## 🧹 Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer aussi les volumes (⚠️ supprime les données)
docker-compose down -v

# Nettoyer les images inutilisées
docker image prune -a

# Nettoyage complet
docker system prune -a --volumes
```

## 🎓 Bonnes Pratiques

1. **Versioning sémantique** : Utilisez des tags `v1.0.0`, `v1.1.0`, etc.
2. **Builds multi-stage** : Optimise la taille des images
3. **Health checks** : Vérifications automatiques de l'état des services
4. **Secrets** : Ne commitez JAMAIS de secrets dans Git
5. **Cache Docker** : Utilisé automatiquement dans GitHub Actions
6. **Documentation** : Maintenez ce fichier à jour

## 📝 Notes

- Les images sont buildées avec **Docker BuildKit** pour de meilleures performances
- Le cache GitHub Actions accélère les builds suivants
- Les images Alpine sont utilisées pour minimiser la taille
- Tous les services incluent des health checks pour Docker Swarm/Kubernetes

## 🆘 Dépannage

### Problème : Build échoue

```bash
# Vérifier les logs du workflow GitHub
# GitHub → Actions → Sélectionner le workflow échoué

# Tester localement
docker build -t test-image .
```

### Problème : Impossible de pull les images

```bash
# Vérifier l'authentification
docker logout ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Vérifier la visibilité du package (Public vs Private)
```

### Problème : Services ne communiquent pas

```bash
# Vérifier le réseau
docker network inspect galileo-network

# Vérifier les logs
docker-compose logs
```

## 📚 Ressources

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions for Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)

---

**Dernière mise à jour** : 21 décembre 2025
