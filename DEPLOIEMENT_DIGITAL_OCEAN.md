# 📚 GUIDE COMPLET DE DÉPLOIEMENT GALILEO SUR DIGITAL OCEAN

**Date:** 22 décembre 2025  
**Auteur:** Guide généré pour déploiement personnalisé Galileo  
**Version du projet:** 1.0.0  

---

## 📋 TABLE DES MATIÈRES

1. [Analyse du Projet](#analyse-du-projet)
2. [Architecture Générale](#architecture-générale)
3. [Prérequis et Préparation](#prérequis-et-préparation)
4. [Configuration du Droplet Digital Ocean](#configuration-du-droplet-digital-ocean)
5. [Déploiement Initial](#déploiement-initial)
6. [Configuration Post-Déploiement](#configuration-post-déploiement)
7. [Vérifications et Tests](#vérifications-et-tests)
8. [Maintenance et Monitoring](#maintenance-et-monitoring)
9. [Dépannage](#dépannage)

---

## 📊 ANALYSE DU PROJET

### Résumé Exécutif
**Galileo** est une **revue scientifique numérique** avec :
- 🎨 **Frontend:** Application React 19 moderne avec TypeScript, Vite, authentification Firebase
- 📡 **Backend:** Architecture microservices Spring Boot avec 3 services + 1 gateway
- 🔍 **Recherche:** Elasticsearch pour les recherches avancées
- 💾 **Stockage:** 2 bases PostgreSQL (Lecture + Écriture)
- 🌐 **Production:** Docker + Docker Compose + Nginx

### Stack Technique Détaillé

#### 🎨 Frontend (React)
```
Technologie      : React 19.2.0, TypeScript 5.8, Vite 6.2
Port             : 3000 (dev) → 80 (prod via Nginx)
Authentification : Firebase 12.7.0
Dépendances      : 
  - axios (HTTP)
  - react-router-dom (routing)
  - @google/genai (AI integration)
  - react-dropzone (file uploads)
```

**Déploiement:** Build statique en Nginx (2 stages Docker)

#### 📡 Backend - Architecture Microservices (Spring Boot)
```
Gateway (API Gateway)
├── Port: 8080
└── Authentification Firebase + routage vers services

Service Lecture (Read-only)
├── Port: 8081
├── DB: PostgreSQL (5432)
├── Elasticsearch: 9200
└── Fonctionnalités: Consultation, recherche, publication

Service Écriture (Write operations)
├── Port: 8082
├── DB: PostgreSQL (5433)
└── Fonctionnalités: Soumissions, workflow de validation admin

Elasticsearch
├── Port: 9200
├── 9300 (inter-node)
├── Heap: 512m (peut être augmenté)
└── Mode: Single-node (OK pour prod petite/moyenne)
```

#### 💾 Bases de Données
```
db-lecture:
  - DB: db_galileo_lecture
  - Port: 5432 (interne)
  - User: galileo_user
  - Contient: publications publiques, commentaires

db-ecriture:
  - DB: db_galileo_ecriture
  - Port: 5433 (interne)
  - User: galileo_user
  - Contient: soumissions, workflow admin
```

#### 🌐 Networking
- Network Docker: `galileo-network`
- Services communiquent via noms DNS internes
- Nginx proxy /api/ vers gateway:8080

### Fichiers Critique du Projet

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Orchestration complète (6 services) |
| `Dockerfile` | Build frontend React en 2 stages |
| `nginx.conf` | Config Nginx (proxy API, cache, security headers) |
| `backend/docker-compose.yml` | Services backend (legacy, peut être supprimé) |
| `.env` | Variables d'environnement (Firebase, Gemini API, etc.) |
| `package.json` | Dépendances frontend (npm) |
| `pom.xml` (x3) | Dépendances backend Maven (gateway, lecture, ecriture) |

### Points Clés de l'Architecture

✅ **Avantages:**
- Architecture découplée (microservices)
- Séparation lecture/écriture (scalabilité)
- Elasticsearch pour recherche performante
- CQRS pattern (Command Query Responsibility Segregation)
- Health checks Docker configurés
- Persistent volumes pour données

⚠️ **Considérations:**
- 6 conteneurs à gérer (charge mémoire ~2-3 GB minimum)
- 2 bases PostgreSQL (maintenance double)
- Elasticsearch en single-node (OK pour dev/staging, revoir pour vrai production)
- Firebase credentials requises côté server
- Gemini API key requise côté client

---

## 🏗️ ARCHITECTURE GÉNÉRALE

### Diagramme d'Architecture Complète

```
┌─────────────────────────────────────────────────────────────────┐
│                        DIGITAL OCEAN DROPLET                     │
│                    Ubuntu 22.04 LTS / 2GB RAM                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    DOCKER + DOCKER       │
                    │      COMPOSE             │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
    ┌───▼────┐            ┌──────▼──────┐          ┌───────▼────┐
    │ Nginx  │ reverse    │  Spring     │          │ PostgreSQL │
    │ Port80 │ proxy      │  Gateway    │          │  5432      │
    │443(SSL)│ /api/      │  Port 8080  │◄────────►│ db-lecture │
    └───┬────┘            └──────┬──────┘          └────────────┘
        │                        │
        │                 ┌──────┴──────┐
        │                 │             │
        │            ┌────▼────┐    ┌──▼──────┐
        │            │ Service  │    │ Service │
        │            │ Lecture  │    │Écriture │
        │            │ 8081     │    │ 8082    │
        │            └────┬────┘    └──┬──────┘
        │                 │             │
        │        ┌────────┴────┐        │
        │        │             │        │
        │    ┌───▼──┐     ┌──┴▼──────┐ │
        │    │ ES   │     │PostgreSQL│ │
        │    │9200  │     │5433      │ │
        │    │      │     │db-ecriture
        │    └──────┘     └──────────┘ │
        │                              │
        │          Volumes Persistants │
        └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  Clients Web                                     │
│            (Navigateur: http://your-domain.com)                │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de Requête Type

```
1. Utilisateur accède à https://votre-domaine.com
2. Nginx (port 443) sert le frontend React compilé
3. Frontend effectue requête AJAX à /api/...
4. Nginx reverse proxy vers Gateway:8080
5. Gateway authentifie avec Firebase
6. Gateway route vers Service Lecture/Écriture (8081/8082)
7. Service interroge PostgreSQL ou Elasticsearch
8. Réponse JSON retourne au frontend
9. React rend la UI
```

---

## 📝 PRÉREQUIS ET PRÉPARATION

### Avant de Commencer

**Checkpoints à valider:**

- [x] Droplet Digital Ocean créé: `164.92.182.253`
- [x] SSH configuré: `ssh root@164.92.182.253`
- [x] Dépôt GitHub cloneable: `https://github.com/Florentin-artemix/Galileo`
- [ ] Domaine acheté (optionnel, on utilisera l'IP pour démarrer)
- [ ] Firebase credentials disponibles: `firebase-credentials.json`
- [ ] Gemini API key disponible (pour l'IA)
- [ ] Compte Docker Registry vérifié (images publiques disponibles)

### Valider la Connectivité SSH

```bash
# Depuis votre machine locale
ssh root@164.92.182.253
# Doit afficher un prompt sans erreur

# Vérifier la version Ubuntu
lsb_release -a
# Attendu: Ubuntu 22.04 LTS

# Vérifier l'espace disque
df -h
# Minimum 20 GB libres recommandé
```

### Préparer les Credentials Nécessaires

**1. Firebase Credentials:**
```bash
# Sur votre machine locale, créer un fichier:
# backend/config/firebase-credentials.json

# Le fichier doit contenir:
{
  "type": "service_account",
  "project_id": "votre-projet-firebase",
  "private_key_id": "...",
  "private_key": "...",
  ...
}
```

**2. Gemini API Key:**
```bash
# Obtenir de https://ai.google.dev/
# Sera utilisé dans l'env du frontend
```

**3. Variables d'Environnement:**
Créer un fichier `.env` à la racine du projet:
```bash
# Frontend
VITE_API_URL=http://localhost:8080
GEMINI_API_KEY=votre-cle-api-gemini

# Backend (sera utilisé via docker-compose)
# Les credentials sont dans le docker-compose.yml
```

---

## 🚀 CONFIGURATION DU DROPLET DIGITAL OCEAN

### Étape 1: Connexion et Mise à Jour Système

```bash
# Se connecter au droplet
ssh root@164.92.182.253

# Mettre à jour les paquets
sudo apt update && sudo apt upgrade -y

# Vérifier les versions
lsb_release -a
uname -r
```

### Étape 2: Installation de Docker et Docker Compose

```bash
# Installer les dépendances nécessaires
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Ajouter la clé GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Ajouter le repository Docker
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Installer Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Vérifier l'installation
docker --version
docker compose version

# Permettre à l'utilisateur root d'utiliser Docker sans sudo
sudo usermod -aG docker root

# Vérifier que ça marche
docker ps
```

### Étape 3: Créer la Structure des Répertoires

```bash
# Créer le répertoire de travail
mkdir -p ~/Galileo
mkdir -p ~/galileo-data/backups
mkdir -p ~/galileo-data/logs
mkdir -p ~/galileo-data/volumes

# Structure complète
cd ~/Galileo
ls -la

# Devrait être vide pour l'instant
```

### Étape 4: Cloner le Projet depuis GitHub

```bash
# Naviguer au répertoire
cd ~/Galileo

# Cloner le projet depuis le dépôt distant
git clone https://github.com/Florentin-artemix/Galileo .

# Vérifier le clone
ls -la
# Doit afficher: docker-compose.yml, Dockerfile, package.json, etc.

# Vérifier les fichiers importants
ls -la backend/
# Doit afficher: galileo-gateway, galileo-lecture, galileo-ecriture
```

### Étape 5: Configurer les Variables d'Environnement

```bash
# Créer le fichier .env
cat > ~/Galileo/.env << 'EOF'
# ============================================
# CONFIGURATION GALILEO - DIGITAL OCEAN
# ============================================

# FRONTEND
VITE_API_URL=http://localhost:8080
GEMINI_API_KEY=your-gemini-api-key-here

# DATABASE - Common
DB_USER=galileo_user
DB_PASSWORD=galileo_pass_2025  # À CHANGER EN PRODUCTION!

# ELASTICSEARCH
ELASTICSEARCH_HEAP_SIZE=512m

# SPRING PROFILES
SPRING_PROFILES_ACTIVE=docker
EOF

# Afficher le fichier pour vérification
cat ~/Galileo/.env
```

**⚠️ IMPORTANT - Sécurité Production:**
```bash
# En production, changer le mot de passe PostgreSQL
# Générer un password sécurisé:
openssl rand -base64 32

# Mettre à jour .env avec ce password
```

### Étape 6: Ajouter les Credentials Firebase

```bash
# Créer le répertoire de configuration
mkdir -p ~/Galileo/backend/galileo-gateway/config

# Transfert du fichier depuis votre machine locale
# (À effectuer depuis votre machine Windows)

# Ou créer un fichier vide pour tests:
touch ~/Galileo/backend/galileo-gateway/config/firebase-credentials.json

# Note: Sans ce fichier, l'authentification Firebase ne fonctionnera pas
```

**⚠️ Comment transférer depuis Windows:**
```powershell
# Sur votre machine Windows (PowerShell Admin)
# Supposant que vous avez le fichier en local

$ScpPath = "C:\Program Files\Git\usr\bin\scp.exe"
& $ScpPath -r "C:\chemin\vers\firebase-credentials.json" "root@164.92.182.253:~/Galileo/backend/galileo-gateway/config/"
```

---

## ⚙️ DÉPLOIEMENT INITIAL

### Étape 1: Analyse des Images Docker

Le projet utilise des images Docker pré-construites disponibles sur GitHub Container Registry:

```bash
# Vérifier l'accès aux images
docker pull ghcr.io/florentin-artemix/galileo-frontend:latest
docker pull ghcr.io/florentin-artemix/galileo-gateway:latest
docker pull ghcr.io/florentin-artemix/galileo-lecture:latest
docker pull ghcr.io/florentin-artemix/galileo-ecriture:latest
```

### Étape 2: Premier Démarrage des Services

```bash
# Naviguer au répertoire du projet
cd ~/Galileo

# Afficher le docker-compose pour vérification
cat docker-compose.yml

# Démarrer les services (avec logs)
docker compose up -d

# Vérifier que tous les conteneurs démarrent
docker compose ps

# Attendu: 6 conteneurs en status "Up"
```

**Si certains conteneurs ne démarrent pas:**
```bash
# Vérifier les logs d'un conteneur spécifique
docker compose logs galileo-frontend
docker compose logs galileo-gateway
docker compose logs galileo-service-lecture
docker compose logs galileo-service-ecriture
docker compose logs galileo-db-lecture
docker compose logs galileo-elasticsearch

# Si besoin, redémarrer un service
docker compose restart galileo-gateway
```

### Étape 3: Attendre le Démarrage Complet

```bash
# Les services ont des health checks
# Attendre 60-90 secondes pour le démarrage complet

# Vérifier l'état des services
docker compose ps --format "table {{.Names}}\t{{.Status}}"

# Attendu:
# galileo-frontend       Up 2 minutes (healthy)
# galileo-gateway        Up 2 minutes (healthy)
# galileo-service-lecture Up 2 minutes (healthy)
# galileo-service-ecriture Up 2 minutes (healthy)
# galileo-db-lecture     Up 2 minutes (healthy)
# galileo-db-ecriture    Up 2 minutes (healthy)
# galileo-elasticsearch  Up 2 minutes (healthy)
```

### Étape 4: Accéder à l'Application

```bash
# Obtenir l'IP du droplet
curl http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address

# Ou utiliser l'IP que vous connaissez
# http://164.92.182.253

# Tester la connectivité
curl -I http://164.92.182.253

# Attendu: HTTP/1.1 200 OK
```

**Accéder via navigateur:**
- Frontend: `http://164.92.182.253:3000` ou directement `http://164.92.182.253` (via Nginx)
- API Gateway health: `http://164.92.182.253:8080/actuator/health`
- Service Lecture health: `http://164.92.182.253:8081/actuator/health`
- Service Écriture health: `http://164.92.182.253:8082/actuator/health`

---

## 🔧 CONFIGURATION POST-DÉPLOIEMENT

### Étape 1: Configurer un Domaine (Optionnel mais Recommandé)

```bash
# Si vous avez un domaine (ex: galileo.example.com)
# Pointer le DNS vers 164.92.182.253

# Vérifier que le DNS est propagé
nslookup galileo.example.com

# Mettre à jour la configuration Nginx
sudo nano /etc/nginx/sites-available/galileo

# Ajouter:
server {
    listen 80;
    server_name galileo.example.com;
    
    # Rediriger vers le conteneur Nginx
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activer la config
sudo ln -s /etc/nginx/sites-available/galileo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 2: Configurer SSL/HTTPS avec Certbot

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Générer un certificat (remplacer galileo.example.com)
sudo certbot certonly --standalone -d galileo.example.com

# Configurer Nginx pour HTTPS
# (Certbot peut le faire automatiquement)
sudo certbot --nginx -d galileo.example.com

# Vérifier le renouvellement automatique
sudo systemctl status certbot.timer
```

### Étape 3: Configurer les Volumes Persistants

```bash
# Vérifier les volumes créés par Docker
docker volume ls

# Vérifier où les données sont stockées
docker volume inspect galileo_postgres-lecture-data

# Créer des répertoires de sauvegarde
mkdir -p ~/galileo-data/db-backups
mkdir -p ~/galileo-data/elasticsearch-backups

# Vérifier l'espace utilisé
du -sh ~/galileo-data
```

### Étape 4: Configurer le Monitoring Basique

```bash
# Créer un script de monitoring simple
cat > ~/galileo-monitor.sh << 'EOF'
#!/bin/bash
echo "=== GALILEO DEPLOYMENT STATUS ==="
echo "Timestamp: $(date)"
echo ""
echo "=== Container Status ==="
docker compose -f ~/Galileo/docker-compose.yml ps

echo ""
echo "=== Memory Usage ==="
docker stats --no-stream

echo ""
echo "=== Disk Usage ==="
df -h /

echo ""
echo "=== API Gateway Health ==="
curl -s http://localhost:8080/actuator/health | jq . || echo "Error checking health"

echo ""
echo "=== Database Connections ==="
docker compose -f ~/Galileo/docker-compose.yml exec -T galileo-db-lecture psql -U galileo_user -d db_galileo_lecture -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;" 2>/dev/null || echo "DB connection check skipped"
EOF

chmod +x ~/galileo-monitor.sh

# Exécuter le script
bash ~/galileo-monitor.sh
```

---

## ✅ VÉRIFICATIONS ET TESTS

### Étape 1: Tests de Connectivité

```bash
# Test 1: Vérifier que le frontend charge
curl -s http://localhost:3000 | head -20

# Test 2: Vérifier que l'API répond
curl -s http://localhost:8080/actuator/health | jq .

# Test 3: Vérifier que les bases de données sont accessibles
docker compose exec -T galileo-db-lecture pg_isready -U galileo_user

# Test 4: Vérifier Elasticsearch
curl -s http://localhost:9200/_cluster/health | jq .
```

### Étape 2: Tests Fonctionnels

```bash
# Test authentification Firebase
# (Nécessite de compléter la config Firebase)

curl -X POST http://localhost:8080/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'

# Test accès base de données lecture
curl -s http://localhost:8080/api/publications | jq .

# Test accès base de données écriture
curl -X POST http://localhost:8080/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test submission"}'
```

### Étape 3: Test de Charge Simple

```bash
# Installer ab (Apache Bench)
sudo apt install -y apache2-utils

# Test simple (100 requêtes, 10 concurrentes)
ab -n 100 -c 10 http://localhost:3000/

# Affiche: temps réponse, tps, etc.
```

### Étape 4: Vérifier les Logs

```bash
# Logs du frontend
docker compose logs galileo-frontend --tail=20

# Logs du gateway
docker compose logs galileo-gateway --tail=20

# Logs de tous les services
docker compose logs --tail=50

# Logs temps réel
docker compose logs -f
```

---

## 📊 MAINTENANCE ET MONITORING

### Sauvegarde des Bases de Données

```bash
# Créer un script de sauvegarde
cat > ~/galileo-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="$HOME/galileo-data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Sauvegarder PostgreSQL lecture
docker compose -f ~/Galileo/docker-compose.yml exec -T galileo-db-lecture \
  pg_dump -U galileo_user db_galileo_lecture | gzip > "$BACKUP_DIR/db-lecture-$TIMESTAMP.sql.gz"

# Sauvegarder PostgreSQL écriture
docker compose -f ~/Galileo/docker-compose.yml exec -T galileo-db-ecriture \
  pg_dump -U galileo_user db_galileo_ecriture | gzip > "$BACKUP_DIR/db-ecriture-$TIMESTAMP.sql.gz"

# Nettoyer les anciennes sauvegardes (plus de 7 jours)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x ~/galileo-backup.sh

# Exécuter une sauvegarde manuelle
bash ~/galileo-backup.sh

# Automatiser avec cron (quotidien à 2h du matin)
crontab -e
# Ajouter: 0 2 * * * $HOME/galileo-backup.sh >> $HOME/galileo-data/logs/backup.log 2>&1
```

### Restauration d'une Sauvegarde

```bash
# Lister les sauvegardes disponibles
ls -lah ~/galileo-data/backups/

# Restaurer une sauvegarde spécifique
BACKUP_FILE="~/galileo-data/backups/db-lecture-20250101_020000.sql.gz"

# Arrêter les services
docker compose -f ~/Galileo/docker-compose.yml stop

# Restaurer la base de données
zcat "$BACKUP_FILE" | docker compose -f ~/Galileo/docker-compose.yml exec -T galileo-db-lecture \
  psql -U galileo_user db_galileo_lecture

# Redémarrer
docker compose -f ~/Galileo/docker-compose.yml up -d
```

### Mise à Jour de l'Application

```bash
# Arrêter les services
docker compose -f ~/Galileo/docker-compose.yml down

# Mettre à jour le code depuis Git
cd ~/Galileo
git pull origin main

# Reconstruire les images (si changements locaux)
docker compose build --no-cache

# Ou utiliser les images du registre (plus rapide)
docker pull ghcr.io/florentin-artemix/galileo-frontend:latest
docker pull ghcr.io/florentin-artemix/galileo-gateway:latest
docker pull ghcr.io/florentin-artemix/galileo-lecture:latest
docker pull ghcr.io/florentin-artemix/galileo-ecriture:latest

# Redémarrer
docker compose up -d

# Vérifier
docker compose ps
```

### Monitoring Continu avec Watch

```bash
# Installation (si nécessaire)
sudo apt install -y watch

# Monitor continu (MAJ toutes les 5 secondes)
watch -n 5 'docker compose -f ~/Galileo/docker-compose.yml ps'

# Ou avec jq pour le health
watch -n 10 'docker compose -f ~/Galileo/docker-compose.yml ps --format "table {{.Names}}\t{{.Status}}"'
```

### Alertes et Logs

```bash
# Vérifier les conteneurs qui ont échoué
docker compose -f ~/Galileo/docker-compose.yml ps --filter "status=exited"

# Voir les derniers logs d'erreur
docker compose -f ~/Galileo/docker-compose.yml logs --tail=100 | grep -i error

# Archiver les logs quotidiennement
cat > ~/log-archiver.sh << 'EOF'
#!/bin/bash
LOGS_DIR="$HOME/galileo-data/logs"
mkdir -p "$LOGS_DIR"
docker compose -f ~/Galileo/docker-compose.yml logs > "$LOGS_DIR/galileo-$(date +\%Y\%m\%d).log"
# Garder seulement les 30 derniers jours
find "$LOGS_DIR" -name "*.log" -mtime +30 -delete
EOF

chmod +x ~/log-archiver.sh
```

---

## 🛠️ DÉPANNAGE

### Problème: Les conteneurs ne démarrent pas

**Diagnostic:**
```bash
# Vérifier les logs détaillés
docker compose logs galileo-gateway
docker compose logs galileo-service-lecture
docker compose logs galileo-service-ecriture

# Vérifier les erreurs build
docker compose up --no-detach
```

**Solutions courantes:**

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `Error starting userland proxy` | Port déjà utilisé | `lsof -i :3000` et tuer le process |
| `Connection refused` | Service ne démarre pas | Vérifier les logs, augmenter le timeout |
| `Out of memory` | Manque de RAM | Augmenter la RAM du droplet ou réduire Elasticsearch heap |
| `Permission denied` | Droits Docker | `sudo usermod -aG docker root` |

### Problème: Base de données inaccessible

```bash
# Vérifier que le conteneur DB est actif
docker ps | grep db-

# Si le conteneur ne démarre pas, vérifier le volume
docker volume ls | grep galileo

# Ou réinitialiser complètement
docker compose down -v  # ⚠️ Cela supprime TOUTES les données
docker compose up -d
```

### Problème: Elasticsearch ne démarre pas

```bash
# Elasticsearch demande de l'espace disque et des limitations mémoire

# Vérifier l'espace disque
df -h /

# Augmenter la limite mémoire (max_map_count)
sudo sysctl -w vm.max_map_count=262144

# Rendre persistant
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Problème: API Gateway timeout

```bash
# Peut être causé par:
# 1. Services dépendants trop lents à démarrer
# 2. Trop de requêtes concurrentes
# 3. Requêtes vers les BD qui timeout

# Solution 1: Redémarrer avec plus de temps
docker compose restart galileo-gateway
sleep 30
docker compose ps

# Solution 2: Augmenter les timeouts dans docker-compose.yml
# Augmenter healthcheck retries et timeout
```

### Problème: Firebase credentials introuvables

```bash
# Vérifier le chemin
ls -la ~/Galileo/backend/galileo-gateway/config/

# Doit contenir: firebase-credentials.json

# Si manquant, créer un fichier de remplacement
cat > ~/Galileo/backend/galileo-gateway/config/firebase-credentials.json << 'EOF'
{
  "type": "service_account",
  "project_id": "placeholder",
  "private_key_id": "placeholder",
  "private_key": "-----BEGIN PRIVATE KEY-----\nPlaceholder\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-placeholder@placeholder.iam.gserviceaccount.com",
  "client_id": "placeholder",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
EOF

# Note: L'authentification Firebase ne fonctionnera pas, mais l'app démarrera
```

### Vérification de Santé Globale

```bash
# Script de diagnostic complet
cat > ~/galileo-health-check.sh << 'EOF'
#!/bin/bash
echo "=== GALILEO DEPLOYMENT HEALTH CHECK ==="
echo ""

# Check 1: Docker daemon
if docker ps >/dev/null 2>&1; then
  echo "✓ Docker est accessible"
else
  echo "✗ Docker n'est pas accessible"
  exit 1
fi

# Check 2: Conteneurs actifs
COUNT=$(docker compose -f ~/Galileo/docker-compose.yml ps --services | wc -l)
echo "✓ Nombre de services: $COUNT"

# Check 3: Status des conteneurs
docker compose -f ~/Galileo/docker-compose.yml ps

# Check 4: Espace disque
SPACE=$(df -h / | awk 'NR==2 {print $5}')
echo ""
echo "Espace disque utilisé: $SPACE"

# Check 5: Mémoire
FREE_MEM=$(free -h | awk 'NR==2 {print $7}')
echo "Mémoire libre: $FREE_MEM"

# Check 6: API health
echo ""
echo "API Gateway health:"
curl -s http://localhost:8080/actuator/health | jq . || echo "Gateway inaccessible"

# Check 7: Elasticsearch
echo ""
echo "Elasticsearch status:"
curl -s http://localhost:9200/_cluster/health | jq . || echo "ES inaccessible"

echo ""
echo "=== FIN DIAGNOSIS ==="
EOF

chmod +x ~/galileo-health-check.sh
bash ~/galileo-health-check.sh
```

---

## 📋 CHECKLIST DE DÉPLOIEMENT

### ✅ Pre-Déploiement

- [ ] Droplet Digital Ocean créé avec Ubuntu 22.04 LTS
- [ ] SSH configuré et testé
- [ ] Git installé et dépôt clonable
- [ ] Docker et Docker Compose installés
- [ ] Espace disque minimum 20 GB disponible
- [ ] Mémoire minimum 2 GB RAM
- [ ] Credentials Firebase préparés
- [ ] Gemini API key disponible

### ✅ Déploiement Initial

- [ ] Clonage du dépôt GitHub complété
- [ ] Fichier `.env` configuré correctement
- [ ] Firebase credentials transférés
- [ ] `docker compose up -d` exécuté sans erreurs
- [ ] Tous les 6 conteneurs démarrés avec status "healthy"
- [ ] Frontend accessible via navigateur
- [ ] API Gateway health check OK

### ✅ Configuration Post-Déploiement

- [ ] Domaine pointant vers le droplet (si applicable)
- [ ] SSL/HTTPS configuré avec Certbot (si domaine)
- [ ] Volumes persistants créés et configurés
- [ ] Script de backup créé et testé
- [ ] Cronjob de backup configuré
- [ ] Monitoring basique mis en place
- [ ] Logs archivés

### ✅ Tests Fonctionnels

- [ ] Frontend charge correctement
- [ ] API répond aux requêtes
- [ ] Authentification Firebase fonctionne
- [ ] Accès bases de données OK
- [ ] Elasticsearch opérationnel
- [ ] Upload fichiers fonctionne (si applicable)
- [ ] Recherche fonctionne
- [ ] Test de charge réussi

### ✅ Maintenance

- [ ] Première sauvegarde effectuée
- [ ] Plan de backup en place
- [ ] Procédure de restore testée
- [ ] Alertes configurées
- [ ] Documentation mise à jour
- [ ] Équipe formée sur l'opération

---

## 🚨 COMMANDES D'URGENCE

```bash
# Si tout crash, restart complet
cd ~/Galileo
docker compose down
docker system prune -a --volumes  # ⚠️ DESTRUCTIF
docker compose up -d

# Voir l'état global rapidement
docker compose ps

# Logs en temps réel
docker compose logs -f

# Arrêter proprement
docker compose down

# Arrêter proprement avec volumes
docker compose down -v  # ⚠️ Supprime les données

# Redémarrer un service spécifique
docker compose restart galileo-gateway

# Exécuter une commande dans un conteneur
docker compose exec galileo-db-lecture psql -U galileo_user -d db_galileo_lecture

# Afficher les utilisation ressources
docker stats

# Nettoyer les ressources inutilisées
docker system prune
```

---

## 📞 SUPPORT ET RESSOURCES

### Documentation Officielle
- Docker: https://docs.docker.com/
- Spring Boot: https://spring.io/projects/spring-boot
- PostgreSQL: https://www.postgresql.org/docs/
- Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/current/
- Firebase: https://firebase.google.com/docs
- Digital Ocean: https://docs.digitalocean.com/

### Dépôt GitHub
- Projet: https://github.com/Florentin-artemix/Galileo
- Issues: https://github.com/Florentin-artemix/Galileo/issues
- Container Registry: https://github.com/Florentin-artemix/Galileo/pkgs/container

### Commandes Utiles

```bash
# Mettre à jour ce guide après déploiement
cd ~/Galileo
git log --oneline | head

# Afficher la version du projet
git describe --tags

# Vérifier les changements non committés
git status

# Obtenir les détails du déploiement actuel
docker compose images
```

---

## 📝 NOTES FINALES

### 🎯 Prochaines Étapes Recommandées

1. **Configuration du domaine:** Pointer votre domaine vers `164.92.182.253`
2. **SSL/HTTPS:** Utiliser Certbot pour un certificat gratuit Let's Encrypt
3. **Monitoring avancé:** Installer Prometheus + Grafana pour un monitoring professionnel
4. **Backups hors-site:** Transférer les backups vers S3 ou Azure Blob Storage
5. **Mise en place d'alertes:** Configurer des notifications pour les problèmes
6. **Documentation interne:** Adapter ce guide à votre contexte spécifique

### ⚠️ Sécurité - Points Critiques

1. **Ne JAMAIS committer les secrets:**
   - `.env` doit être dans `.gitignore`
   - `firebase-credentials.json` doit être dans `.gitignore`
   - Les API keys doivent être en variables d'environnement

2. **Changer les mots de passe par défaut:**
   ```bash
   # Générer des passwords sécurisés
   openssl rand -base64 32
   ```

3. **Configurer le firewall:**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw default deny incoming
   sudo ufw enable
   ```

4. **Sauvegardes régulières:** Minimum 1x/jour, gardées pendant 30 jours

### 📈 Scalabilité Future

Quand l'application croît:

1. **Elasticsearch:** Passer du single-node au cluster (min 3 nodes)
2. **PostgreSQL:** Implémenter replicas et load balancing
3. **Cache:** Ajouter Redis pour cache applicatif
4. **CDN:** Utiliser un CDN pour les assets statiques
5. **Monitoring:** Prometheus + Grafana + AlertManager
6. **Logs:** Elasticsearch + Kibana (ELK stack)
7. **Load Balancer:** Nginx/HAProxy avec plusieurs instances
8. **Orchestration:** Migration vers Kubernetes si besoin

### 🎉 Succès!

Si vous voyez l'application fonctionner à `http://164.92.182.253`, **félicitations!** 🎊

Vous avez déployé avec succès une architecture microservices complète sur Digital Ocean!

---

**Dernière mise à jour:** 22 décembre 2025  
**Version du guide:** 1.0.0  
**Statut:** ✅ Production Ready
