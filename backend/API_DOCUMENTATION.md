# 📚 Documentation API - Galileo Microservices

## Architecture

Le système Galileo est composé de 3 microservices principaux :

```
┌─────────────────────────────────────────────┐
│         API Gateway (Port 8080)             │
│  - Authentification Firebase                │
│  - Routage vers les services                │
│  - CORS & Rate Limiting                     │
└────────┬──────────────────┬─────────────────┘
         │                  │
         v                  v
┌────────────────┐   ┌─────────────────┐
│ Service Lecture│   │Service Écriture │
│  (Port 8081)   │   │  (Port 8082)    │
│  - Publications│   │  - Soumissions  │
│  - Blog        │◄──┤  - Validation   │
│  - Événements  │   │  - Workflow     │
└────────────────┘   └─────────────────┘
```

---

## 🌐 API Gateway (Port 8080)

### Routes configurées

| Route | Service cible | Protection |
|-------|---------------|------------|
| `/api/publications/**` | Service Lecture | Public |
| `/api/blog/**` | Service Lecture | Public |
| `/api/evenements/**` | Service Lecture | Public |
| `/api/soumissions/**` | Service Écriture | 🔒 Firebase Auth |
| `/api/admin/**` | Service Écriture | 🔒 Firebase Auth + Admin |

### Headers injectés par le Gateway
- `X-User-Id` : UID Firebase de l'utilisateur authentifié
- `X-User-Email` : Email de l'utilisateur authentifié

---

## 📖 Service Lecture (Port 8081)

Service public en lecture seule pour les publications, blog et événements.

### Publications

#### `GET /publications`
Liste toutes les publications publiées avec pagination.

**Paramètres query :**
- `page` (int, défaut: 0) - Numéro de page
- `size` (int, défaut: 20) - Taille de page
- `sortBy` (string, défaut: "datePublication") - Champ de tri
- `direction` (string, défaut: "DESC") - Direction du tri (ASC/DESC)

**Réponse 200 :**
```json
{
  "content": [
    {
      "id": 1,
      "titre": "Titre de la publication",
      "resume": "Résumé...",
      "auteurPrincipal": "John Doe",
      "coAuteurs": "Jane Smith, Bob Wilson",
      "domaine": "Intelligence Artificielle",
      "motsCles": "IA, Machine Learning",
      "urlPdf": "https://...",
      "urlImageCouverture": "https://...",
      "nombreVues": 125,
      "nombreTelechargements": 45,
      "datePublication": "2025-12-01T10:00:00"
    }
  ],
  "pageable": {...},
  "totalElements": 50,
  "totalPages": 3
}
```

#### `GET /publications/{id}`
Détails d'une publication spécifique (incrémente le compteur de vues).

**Réponse 200 :** Objet Publication complet

#### `POST /publications/recherche`
Recherche avancée de publications.

**Body :**
```json
{
  "rechercheGlobale": "machine learning",
  "domaine": "Intelligence Artificielle",
  "auteur": "John Doe",
  "annee": 2025,
  "motsCles": ["IA", "Deep Learning"]
}
```

**Réponse 200 :** Page<PublicationDTO>

#### `GET /publications/{id}/url-telechargement`
Génère une URL signée temporaire (30 min) pour télécharger le PDF.

**Réponse 200 :**
```json
{
  "url": "https://r2.cloudflarestorage.com/...",
  "validite": "30 minutes"
}
```

### Blog

#### `GET /blog`
Liste des articles de blog avec pagination.

**Paramètres query :** Identiques à /publications

**Réponse 200 :** Page<ArticleBlogDTO>

#### `GET /blog/{id}`
Détails d'un article (incrémente compteur de vues).

#### `GET /blog/populaires`
Top 10 des articles les plus vus.

**Paramètres query :**
- `limite` (int, défaut: 10)

#### `GET /blog/recents`
Articles récents (derniers 30 jours).

**Paramètres query :**
- `limite` (int, défaut: 10)

### Événements

#### `GET /evenements`
Liste tous les événements.

**Réponse 200 :**
```json
[
  {
    "id": 1,
    "titre": "Conférence IA 2025",
    "description": "...",
    "dateDebut": "2025-12-20T09:00:00",
    "dateFin": "2025-12-20T18:00:00",
    "lieu": "Paris",
    "lieuOnline": "https://zoom.us/...",
    "capaciteMax": 100,
    "nombreInscrits": 75,
    "urlImage": "https://...",
    "estPasse": false,
    "estComplet": false
  }
]
```

#### `GET /evenements/a-venir`
Événements futurs uniquement.

#### `GET /evenements/{id}`
Détails d'un événement.

#### `POST /evenements/{id}/inscription`
Inscription à un événement.

**Body :**
```json
{
  "nom": "John Doe",
  "email": "john@example.com",
  "telephone": "+33 6 12 34 56 78"
}
```

---

## ✍️ Service Écriture (Port 8082)

Service protégé pour le workflow de soumission et validation.

### Soumissions (Utilisateurs authentifiés)

#### `POST /api/soumissions`
Créer une nouvelle soumission avec upload de fichier PDF.

**Headers requis :**
- `X-User-Id` : UID Firebase
- `X-User-Email` : Email utilisateur

**Content-Type :** `multipart/form-data`

**Paramètres form-data :**
- `fichierPdf` (file, requis) - PDF max 50MB
- `titre` (string, 10-255 chars)
- `resume` (string, 50-2000 chars)
- `auteurPrincipal` (string, requis)
- `emailAuteur` (string email, requis)
- `coAuteurs` (array[string], optionnel)
- `motsCles` (array[string], 3-10 mots-clés requis)
- `domaineRecherche` (string, requis)
- `notes` (string, max 1000 chars, optionnel)

**Réponse 201 :**
```json
{
  "id": 1,
  "titre": "Mon article",
  "resume": "Résumé...",
  "statut": "EN_ATTENTE",
  "dateSoumission": "2025-12-10T14:30:00",
  "urlPdf": "https://...",
  "...": "..."
}
```

**Erreurs :**
- 400 : Validation échouée (titre trop court, PDF invalide, etc.)
- 500 : Erreur upload R2

#### `GET /api/soumissions`
Liste mes soumissions.

**Headers requis :** `X-User-Id`

**Réponse 200 :** Array<SoumissionResponseDTO>

#### `GET /api/soumissions/{id}`
Détails d'une soumission (vérification propriétaire).

**Headers requis :** `X-User-Id`

#### `DELETE /api/soumissions/{id}`
Retirer ma soumission (seulement si EN_ATTENTE ou EN_REVISION).

**Headers requis :** `X-User-Id`

**Réponse 200 :**
```json
{
  "message": "Soumission retirée avec succès",
  "id": 1
}
```

### Administration (Admins seulement)

#### `GET /api/admin/soumissions/en-attente`
Liste des soumissions en attente de validation.

**Headers requis :** `X-User-Email`

**Réponse 200 :** Array<SoumissionResponseDTO>

#### `GET /api/admin/soumissions?statut=XXX`
Filtrer par statut.

**Statuts possibles :**
- `EN_ATTENTE` : En attente d'examen
- `EN_REVISION` : Corrections demandées
- `VALIDEE` : Acceptée et publiée
- `REJETEE` : Refusée
- `RETIREE` : Retirée par l'auteur

#### `GET /api/admin/soumissions/statistiques`
Compteurs par statut.

**Réponse 200 :**
```json
{
  "EN_ATTENTE": 12,
  "EN_REVISION": 5,
  "VALIDEE": 34,
  "REJETEE": 8,
  "RETIREE": 3
}
```

#### `POST /api/admin/soumissions/{id}/valider`
Valider une soumission → Création automatique d'une Publication.

**Headers requis :** `X-User-Email`

**Body :**
```json
{
  "commentaire": "Excellent article, accepté pour publication !"
}
```

**Réponse 200 :**
```json
{
  "id": 1,
  "statut": "VALIDEE",
  "commentaireAdmin": "Excellent article...",
  "valideePar": "admin@galileo.com",
  "dateValidation": "2025-12-10T15:00:00",
  "publicationId": 42
}
```

**Workflow :**
1. Changement statut → `VALIDEE`
2. Appel Feign Client → Service Lecture
3. Création Publication dans db_galileo_lecture
4. Envoi email de confirmation à l'auteur

#### `POST /api/admin/soumissions/{id}/rejeter`
Rejeter une soumission avec commentaire.

**Body :**
```json
{
  "commentaire": "L'article ne correspond pas aux critères..."
}
```

#### `POST /api/admin/soumissions/{id}/demander-revisions`
Demander des corrections à l'auteur.

**Body :**
```json
{
  "commentaire": "Merci de corriger les points suivants..."
}
```

---

## 🔒 Authentification

### Firebase Authentication

Toutes les routes protégées nécessitent un token Firebase valide.

**Header requis :**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Le Gateway valide le token et injecte les headers :
- `X-User-Id` : UID Firebase
- `X-User-Email` : Email de l'utilisateur

### Obtenir un token Firebase (Frontend)

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Utiliser le token dans les requêtes
fetch('http://localhost:8080/api/soumissions', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

---

## 📊 Monitoring & Health

### Health Checks

Tous les services exposent `/actuator/health` :

```bash
# Gateway
curl http://localhost:8080/actuator/health

# Service Lecture
curl http://localhost:8081/actuator/health

# Service Écriture
curl http://localhost:8082/api/soumissions/health
```

### Métriques (Actuator)

```bash
# Infos sur l'application
curl http://localhost:8081/actuator/info

# Métriques JVM, HTTP, etc.
curl http://localhost:8081/actuator/metrics
```

---

## 🐳 Déploiement Docker

### Build des images

```bash
cd /workspaces/Galileo/backend

# Gateway
docker build -t galileo-gateway:latest ./galileo-gateway

# Service Lecture
docker build -t galileo-lecture:latest ./galileo-lecture

# Service Écriture
docker build -t galileo-ecriture:latest ./galileo-ecriture
```

### Lancement avec Docker Compose

```bash
cd /workspaces/Galileo/backend
docker-compose up -d
```

Services lancés :
- PostgreSQL (db-lecture) : port 5432
- PostgreSQL (db-ecriture) : port 5433
- Elasticsearch : ports 9200, 9300
- Gateway : port 8080
- Service Lecture : port 8081
- Service Écriture : port 8082

---

## 🧪 Tests

### Tests end-to-end

```bash
cd /workspaces/Galileo/backend
./test-e2e.sh
```

### Logs en temps réel

```bash
# Tous les services
./logs-watch.sh all

# Service spécifique
./logs-watch.sh gateway
./logs-watch.sh lecture
./logs-watch.sh ecriture
```

---

## 🔍 API de Recherche Elasticsearch (Port 8081)

### Recherche de publications

#### Recherche full-text
```http
GET /api/search/publications?q=machine+learning&page=0&size=10
```

**Réponse:**
```json
{
  "content": [
    {
      "id": "1",
      "publicationId": 1,
      "titre": "Introduction au Machine Learning",
      "resume": "...",
      "auteurPrincipal": "Dr. Martin",
      "domaine": "IA",
      "motsCles": ["ML", "IA"],
      "datePublication": "2024-01-15T10:00:00",
      "nombreVues": 150,
      "nombreTelechargements": 45
    }
  ],
  "totalElements": 42,
  "totalPages": 5,
  "size": 10,
  "number": 0
}
```

#### Recherche avancée avec filtres
```http
GET /api/search/publications/advanced?q=deep+learning&domaine=IA&auteur=Dr.+Martin&page=0&size=10
```

#### Recherche par domaine
```http
GET /api/search/publications/domain/IA?page=0&size=10
```

#### Recherche par auteur
```http
GET /api/search/publications/author/Dr.+Martin?page=0&size=10
```

#### Autocomplete (suggestions)
```http
GET /api/search/publications/suggest?prefix=machi
```

**Réponse:**
```json
[
  "Machine Learning Basics",
  "Machine Vision Applications",
  "Machines et Société"
]
```

#### Publications similaires
```http
GET /api/search/publications/123/similar?limit=5
```

### Recherche d'articles de blog

#### Recherche full-text
```http
GET /api/search/blog?q=intelligence+artificielle&page=0&size=10
```

#### Recherche par catégorie
```http
GET /api/search/blog/category/Innovation?page=0&size=10
```

#### Autocomplete
```http
GET /api/search/blog/suggest?prefix=intel
```

### Agrégations et statistiques

#### Statistiques par domaine
```http
GET /api/search/aggregations/domains
```

**Réponse:**
```json
{
  "IA": 42,
  "Physique": 38,
  "Mathématiques": 25,
  "Biologie": 18
}
```

#### Top auteurs
```http
GET /api/search/aggregations/authors?limit=10
```

**Réponse:**
```json
{
  "Dr. Martin": 15,
  "Prof. Dupont": 12,
  "Dr. Bernard": 10
}
```

#### Statistiques des catégories de blog
```http
GET /api/search/aggregations/blog-categories
```

**Réponse:**
```json
{
  "Innovation": 23,
  "Recherche": 18,
  "Événements": 12
}
```

### Indexation (ADMIN uniquement)

#### Réindexation complète
```http
POST /api/search/reindex
```

**Réponse:**
```json
{
  "status": "success",
  "message": "Réindexation complète terminée avec succès"
}
```

#### Indexer une publication
```http
POST /api/search/index/publication/123
```

#### Indexer un article de blog
```http
POST /api/search/index/blog/456
```

### Fonctionnalités de recherche

- **Full-text search** : Recherche dans titre, résumé et contenu complet
- **Scoring avancé** : Titre x3, résumé x2, contenu x1
- **Analyseur français** : Stemming et stop words
- **Autocomplete** : Suggestions en temps réel
- **Agrégations** : Statistiques par domaine, auteur, catégorie
- **Publications similaires** : Basé sur mots-clés communs
- **Filtres combinés** : Texte + domaine + auteur
- **Indexation automatique** : Lors de création/modification

---

## 🔧 Configuration

### Variables d'environnement

#### Service Lecture
```bash
# Elasticsearch
ELASTICSEARCH_URIS=http://localhost:9200
ELASTICSEARCH_CONNECTION_TIMEOUT=5s
ELASTICSEARCH_SOCKET_TIMEOUT=30s
```

#### Service Écriture
```bash
# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_KEY=your_secret_key

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@galileo.com
ADMIN_EMAIL=admin@galileo.com
```

#### Gateway
```bash
# Firebase
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-credentials.json
```

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@galileo.com
- 📝 Issues : https://github.com/Florentin-artemix/Galileo/issues
- 📚 Documentation : `PHASE_4_COMPLETE.md`, `PHASE_5_COMPLETE.md`
