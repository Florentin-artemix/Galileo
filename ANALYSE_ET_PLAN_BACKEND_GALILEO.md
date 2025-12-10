# ANALYSE DU PROJET ET PLAN D'IMPLÉMENTATION BACKEND - GALILEO

## 1. ANALYSE DU PROJET : "GALILEO — REVUE SCIENTIFIQUE ÉTUDIANTE"

### PITCH DU PROJET (Pour un investisseur exigeant)

**Le Problème :**
En République Démocratique du Congo, comme dans de nombreuses régions en développement, le talent académique est une ressource abondante mais mal exploitée. Chaque année, des centaines d'étudiants en ingénierie produisent des travaux de recherche, des mémoires et des prototypes brillants. Pourtant, 99% de ces connaissances finissent archivées dans des bibliothèques physiques poussiéreuses, invisibles au monde professionnel et à la communauté scientifique internationale. C'est une perte sèche de capital intellectuel et d'opportunités d'innovation.

**La Solution : Galileo**
Galileo n'est pas simplement un site web ; c'est une **infrastructure numérique de valorisation scientifique**. C'est la première plateforme dédiée à la Faculté Polytechnique (Université Mapon) qui transforme les travaux étudiants en actifs numériques accessibles.

**Pourquoi ce projet est critique (et pourquoi vous devriez le soutenir) :**

1.  **Visibilité & Crédibilité :** Galileo offre une vitrine professionnelle aux étudiants. Au lieu d'un CV vide, un diplômé peut envoyer un lien vers ses publications validées, prouvant ses compétences techniques réelles. C'est un accélérateur de carrière.
2.  **Pont Académique-Industriel :** La plateforme ne sert pas qu'à lire ; elle sert à connecter. En exposant les domaines d'expertise (Mines, Électricité, Informatique), elle permet aux entreprises locales de repérer les talents et les solutions techniques dont elles ont besoin.
3.  **Formation Continue & Mentorat :** Le projet intègre une dimension "Ateliers" (LaTeX, IA, MATLAB). Il ne se contente pas de publier le résultat, il améliore le processus de production scientifique.
4.  **Souveraineté Numérique :** En hébergeant et en diffusant ses propres données scientifiques, l'université reprend le contrôle sur sa production intellectuelle au lieu de dépendre de plateformes étrangères.

**L'État Actuel (MVP) :**
Le prototype actuel est une application React (Vite + TypeScript) robuste et esthétique. Elle est bilingue (Français/Anglais), responsive, et dispose déjà de toutes les interfaces nécessaires : lecture de PDF intégrée, blog, gestion d'événements et présentation d'équipe. Cependant, elle tourne "à vide" sur des données statiques. Pour passer à l'échelle et devenir un outil institutionnel pérenne, elle a impérativement besoin d'un moteur : un Backend.

---

## 2. PLAN D'IMPLÉMENTATION BACKEND (DÉTAILLÉ)

Ce plan vise à transformer le prototype statique en une application dynamique, sécurisée et évolutive.

### A. ARCHITECTURE TECHNIQUE

Nous allons adopter une architecture **REST API** classique mais robuste, découplée du frontend.

*   **Langage & Runtime :** Node.js avec **TypeScript** (pour partager les types avec le frontend).
*   **Framework :** **Express.js** (léger, flexible) ou **NestJS** (si une structure très rigide est préférée, mais Express suffit ici).
*   **Base de Données :** **PostgreSQL**. C'est le standard pour les données relationnelles (Auteurs <-> Publications, Événements <-> Orateurs).
*   **ORM :** **Prisma**. Pour une gestion des types de bout en bout et des migrations de base de données sûres.
*   **Stockage de Fichiers :** **AWS S3** (ou compatible type MinIO/DigitalOcean Spaces) pour stocker les PDFs des articles et les images de couverture. Ne jamais stocker de fichiers sur le serveur d'application.
*   **Authentification :** **JWT (JSON Web Tokens)**. Système de rôles : `ADMIN` (Validation, Publication) et `USER` (Étudiant soumissionnaire - optionnel dans un premier temps).

### B. MODÉLISATION DE LA BASE DE DONNÉES (SCHEMA PRISMA)

Voici la structure de données nécessaire pour supporter toutes les fonctionnalités actuelles.

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  EDITOR
  USER
}

enum SubmissionStatus {
  PENDING
  UNDER_REVIEW
  ACCEPTED
  REJECTED
  PUBLISHED
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // Hashed
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Publication {
  id          Int      @id @default(autoincrement())
  titleFr     String
  titleEn     String
  slug        String   @unique // Pour les URLs SEO-friendly
  summaryFr   String   @db.Text
  summaryEn   String   @db.Text
  date        DateTime
  pdfUrl      String
  imageUrl    String
  domain      String   // Ex: "Électricité"
  views       Int      @default(0)
  downloads   Int      @default(0)
  
  // Relations
  authors     Author[]
  tags        Tag[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Author {
  id           Int           @id @default(autoincrement())
  name         String
  publications Publication[]
}

model BlogPost {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  titleFr     String
  titleEn     String
  summaryFr   String   @db.Text
  summaryEn   String   @db.Text
  contentFr   String   @db.Text // Markdown ou HTML
  contentEn   String   @db.Text
  imageUrl    String
  date        DateTime @default(now())
  author      String   // Nom de l'auteur du post
  
  tags        Tag[]
}

model Event {
  id          Int      @id @default(autoincrement())
  titleFr     String
  titleEn     String
  date        DateTime
  type        String   // Atelier, Conférence...
  location    String
  summaryFr   String
  summaryEn   String
  descriptionFr String @db.Text
  descriptionEn String @db.Text
  imageUrl    String
  
  speakers    Speaker[]
  resources   EventResource[]
  photos      EventPhoto[]
}

model Speaker {
  id        Int     @id @default(autoincrement())
  name      String
  roleFr    String
  roleEn    String
  imageUrl  String
  linkedin  String?
  
  events    Event[]
}

model EventResource {
  id        Int    @id @default(autoincrement())
  name      String
  url       String
  size      String
  format    String
  eventId   Int
  event     Event  @relation(fields: [eventId], references: [id])
}

model EventPhoto {
  id      Int    @id @default(autoincrement())
  url     String
  eventId Int
  event   Event  @relation(fields: [eventId], references: [id])
}

model TeamMember {
  id          Int     @id @default(autoincrement())
  name        String
  roleFr      String
  roleEn      String
  descriptionFr String?
  descriptionEn String?
  imageUrl    String
  location    String?
  email       String?
  phone       String?
  order       Int     @default(0) // Pour gérer l'ordre d'affichage
}

model Tag {
  id           Int           @id @default(autoincrement())
  name         String        @unique
  publications Publication[]
  blogPosts    BlogPost[]
}

// Gestion des soumissions
model Submission {
  id            Int              @id @default(autoincrement())
  submitterName String
  contactEmail  String
  title         String
  authors       String
  affiliations  String
  domain        String
  category      String
  summary       String           @db.Text
  keywords      String
  fileUrl       String           // Le PDF soumis
  status        SubmissionStatus @default(PENDING)
  
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}
```

### C. API ENDPOINTS (SPÉCIFICATIONS)

L'API sera versionnée (ex: `/api/v1`).

#### 1. Authentification
*   `POST /auth/login` : Retourne un JWT.
*   `POST /auth/register` : Création de compte (protégé par une clé secrète ou réservé au super-admin).
*   `GET /auth/me` : Récupérer le profil courant.

#### 2. Publications (Public)
*   `GET /publications` : Liste paginée. Filtres : `?domain=...&search=...`.
*   `GET /publications/:slug` : Détail d'une publication.
*   `GET /publications/:id/download` : Redirection vers le PDF signé (S3) + incrémentation du compteur de téléchargements.

#### 3. Publications (Admin - Protégé)
*   `POST /publications` : Créer une publication (Upload PDF + Image).
*   `PUT /publications/:id` : Modifier.
*   `DELETE /publications/:id` : Supprimer.

#### 4. Blog & Événements
*   Même logique CRUD (Create, Read, Update, Delete) que pour les publications.

#### 5. Soumissions
*   `POST /submissions` : Public. Permet d'envoyer un fichier PDF et les métadonnées.
    *   *Note :* Implémenter un rate-limiting strict ici pour éviter le spam.
    *   *Note :* Validation stricte du type MIME (application/pdf uniquement).
*   `GET /admin/submissions` : Liste des soumissions (Admin).
*   `PATCH /admin/submissions/:id/status` : Changer le statut (ex: Accepter -> Créer automatiquement le brouillon de Publication).

### D. PLAN DE DÉVELOPPEMENT (ROADMAP)

#### Phase 1 : Initialisation & Infrastructure (Jours 1-2)
1.  Initialiser le projet Node.js/TypeScript.
2.  Configurer ESLint/Prettier.
3.  Monter une base PostgreSQL locale (Docker Compose).
4.  Configurer Prisma et appliquer le schéma initial.
5.  Mettre en place le serveur Express de base avec gestion des erreurs globale.

#### Phase 2 : Authentification & Sécurité (Jours 3-4)
1.  Implémenter le hachage des mots de passe (bcrypt).
2.  Implémenter la génération et validation JWT.
3.  Créer les middlewares `isAuthenticated` et `isAdmin`.
4.  Configurer CORS (Cross-Origin Resource Sharing) pour n'accepter que les requêtes venant du domaine frontend.

#### Phase 3 : Gestion des Fichiers (S3) (Jour 5)
1.  Configurer un bucket S3 (ou MinIO local pour le dev).
2.  Créer un service utilitaire d'upload (utilisant `multer` et `aws-sdk`).
3.  Gérer les noms de fichiers uniques (UUID).

#### Phase 4 : CRUD Core (Publications & Blog) (Jours 6-8)
1.  Développer les contrôleurs pour les Publications.
2.  Implémenter la logique de filtrage et pagination.
3.  Développer les contrôleurs pour le Blog.
4.  Connecter les uploads d'images aux articles.

#### Phase 5 : Soumissions & Workflow (Jours 9-10)
1.  Créer l'endpoint de soumission.
2.  Intégrer la validation des fichiers.
3.  Créer le dashboard admin pour voir les soumissions en attente.

#### Phase 6 : Intégration Frontend (Jours 11-14)
1.  Créer un service API dans le frontend (`src/services/api.ts`) utilisant Axios ou Fetch.
2.  Remplacer les appels aux fichiers `data/*.ts` par des appels API asynchrones (`useEffect` ou React Query).
3.  Adapter les composants pour gérer les états de chargement (`isLoading`) et d'erreur.
4.  Connecter le formulaire de la page `SubmissionPage.tsx` à l'API réelle.

### E. DÉTAILS D'IMPLÉMENTATION (SNIPPETS CLÉS)

**Structure des dossiers Backend recommandée :**
```
src/
  config/         # Variables d'env, config DB
  controllers/    # Logique métier (PublicationController.ts...)
  middlewares/    # Auth, Upload, Validation
  routes/         # Définition des URLs
  services/       # Logique complexe (S3Service, EmailService)
  utils/          # Helpers
  app.ts          # Point d'entrée
```

**Exemple de Controller (Publication) :**

```typescript
// src/controllers/PublicationController.ts
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getPublications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, domain } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const whereClause = domain ? { domain: String(domain) } : {};

    const [publications, total] = await Promise.all([
      prisma.publication.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: { authors: true, tags: true },
        orderBy: { date: 'desc' }
      }),
      prisma.publication.count({ where: whereClause })
    ]);

    res.json({
      data: publications,
      meta: {
        total,
        page: Number(page),
        last_page: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la récupération" });
  }
};
```

**Sécurité & Production :**
*   **Helmet.js** : Pour sécuriser les en-têtes HTTP.
*   **Rate Limiting** : `express-rate-limit` pour bloquer les attaques par force brute.
*   **Validation** : Utiliser `Zod` ou `Joi` pour valider toutes les entrées (req.body) avant de toucher à la base de données.
*   **Logs** : Utiliser `Winston` ou `Morgan` pour garder une trace de l'activité.

Ce plan fournit une feuille de route complète pour transformer Galileo en une plateforme de production robuste.
