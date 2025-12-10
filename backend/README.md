# GALILEO - Backend Microservices

Architecture microservices pour la plateforme Galileo (Revue Scientifique Étudiante).

## Structure du Projet

```
backend/
├── galileo-gateway/       # API Gateway (Spring Cloud Gateway)
├── galileo-lecture/       # Service de consultation publique
├── galileo-ecriture/      # Service de workflow et administration
└── docker-compose.yml     # Orchestration des services d'infrastructure
```

## Services

### 1. galileo-gateway (Port 8080)
Point d'entrée unique de l'API. Gère :
- Routage vers les microservices
- Authentification Firebase
- Rate limiting
- CORS

### 2. galileo-lecture (Port 8081)
Service public en lecture seule. Gère :
- Publications scientifiques
- Articles de blog
- Événements
- Recherche via Elasticsearch

### 3. galileo-ecriture (Port 8082)
Service d'administration. Gère :
- Soumissions d'articles
- Validation par les admins
- Upload vers Backblaze B2
- Workflow de publication

## Bases de Données

- `db-lecture` (Port 5432) : PostgreSQL pour les données publiques
- `db-ecriture` (Port 5433) : PostgreSQL pour les soumissions
- `elasticsearch` (Port 9200) : Moteur de recherche

## Démarrage

### Prérequis
- Java 21
- Maven 3.9+
- Docker & Docker Compose

### Lancer l'infrastructure
```bash
cd backend
docker-compose up -d
```

### Vérifier les services
```bash
docker-compose ps
```

## Configuration

Les variables d'environnement sont définies dans les fichiers `application.properties` de chaque service.

## Stockage de Fichiers

Le projet utilise **Backblaze B2** (compatible S3) pour stocker :
- PDFs des publications
- Images de couverture
- Photos d'événements

Les fichiers sont stockés en mode **privé** et les URLs sont générées dynamiquement.
