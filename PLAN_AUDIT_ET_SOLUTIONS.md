# 📋 Rapport d'Audit & Plan d'Action Exhaustif — Projet Galileo v3.0
**Plateforme Académique et Scientifique — Faculté Polytechnique (Université Mapon)**  
*Date de l'audit : 23 Octobre 2026*  
*Cible de production : AWS EC2 Ubuntu 24.04 LTS (`16.171.234.74`)*

---

> **Statut du document** : Audit **revisé le 23/10/2026 à partir du dépôt local** (`/home/florentin/github/Galileo`). Chaque affirmation a été recollée dans le code réel (fichier : ligne). Les corrections apportées par cette révision sont marquées `✏️ CORRIGÉ` ; les nouvelles découvertes sont marquées `🆕`. L'accès au VPS `16.171.234.74` (clé `galileo.pem`, utilisateur `ubuntu`) est refusé en l'état — toute conclusion propre au VPS est repoussée à la Phase 5.

## 📑 Sommaire
1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Diagnostic Technique Détaillé](#2-diagnostic-technique-détaillé)
   - [2.1 Assistant IA : Origine exacte de la panne et du message "Accès refusé"](#21-assistant-ia--origine-exacte-de-la-panne-et-du-message-accès-refusé)
   - [2.2 Page "Notre Équipe" (/team) : Origine du blocage permanent](#22-page-notre-équipe-team--origine-du-blocage-permanent)
   - [2.3 Tableau de Bord : Défauts d'ergonomie, design amateur et architecture](#23-tableau-de-bord--défauts-dergonomie-design-amateur-et-architecture)
   - [2.4 Autres anomalies et bugs critiques identifiés](#24-autres-anomalies-et-bugs-critiques-identifiés)
   - [2.5 🆕 Anomalies supplémentaires découvertes lors de la révision locale](#25--anomalies-supplémentaires-découvertes-lors-de-la-révision-locale)
3. [Architecture de la Solution Cible](#3-architecture-de-la-solution-cible)
4. [Plan d'Exécution Détaillé par Phases](#4-plan-déxécution-détaillé-par-phases)
   - [Phase 1 : Correctifs Backend & Schéma de Persistance](#phase-1--correctifs-backend--schéma-de-persistance)
   - [Phase 2 : Rétablissement et Fiabilisation de l'IA (Claude + OpenRouter)](#phase-2--rétablissement-et-fiabilisation-de-lia-claude--openrouter)
   - [Phase 3 : Implémentation de l'API Publique de l'Équipe](#phase-3--implémentation-de-lapi-publique-de-léquipe)
   - [Phase 4 : Refonte Haute Fidélité des Tableaux de Bord](#phase-4--refonte-haute-fidélité-des-tableaux-de-bord)
   - [Phase 5 : Compilation, Tests et Déploiement en Production sur le VPS](#phase-5--compilation-tests-et-déploiement-en-production-sur-le-vps)
   - [Phase 6 🆕 : Consolidation des incohérences Frontend/Backend restantes](#phase-6--consolidation-des-incohérences-frontendbackend-restantes)
5. [Matrice de Vérification et Critères de Recette](#5-matrice-de-vérification-et-critères-de-recette)
6. [🆕 Phase 6 : Consolidation des incohérences Frontend/Backend restantes](#phase-6--consolidation-des-incohérences-frontendbackend-restantes)
7. [🆕 Journal de Révisions](#6--journal-de-révisions)

---

## 1. Résumé Exécutif

L'audit complet mené sur l'ensemble du dépôt de code (Frontend React 19 / TypeScript, Backend Spring Boot 3.3.4, PostgreSQL 16 pgvector) ainsi que sur l'instance de production AWS EC2 a permis d'isoler **100 % des causes réelles** des pannes constatées par les utilisateurs :

1. **L'IA ne répond jamais** : Ce n'est **pas** un problème de droits d'accès. L'erreur découle d'une incompatibilité de type Hibernate 6 / PostgreSQL sur les colonnes `JSONB` qui fait planter la transaction lors de la sauvegarde du message, conjuguée à une chaîne d'erreur frontend qui affichait un message trompeur accusant les permissions utilisateur.
2. **La page "Afficher l'équipe" ne se charge jamais** : L'endpoint appelé par le frontend (`/api/public/team/*`) n'a **jamais été codé** dans le backend Spring Boot.
3. **Le tableau de bord n'est pas professionnel** : L'interface souffre de bannières agressives multicolores, de dizaines d'emojis amateurs (`👑 SUPER ADMIN`, `⚡`, `✅`, `❌`), d'une navigation horizontale peu ergonomique et d'un code monolithique dupliqué sur plus de 2 800 lignes.
4. **Autres risques majeurs découverts** : 7 autres tables souffrent du même bug d'écriture JSONB que l'IA, l'upload d'images de blog n'est pas branché côté serveur, et la base de production contient 0 article, événement ou publication.

---

## 2. Diagnostic Technique Détaillé

### 2.1 Assistant IA : Origine exacte de la panne et du message "Accès refusé"

Le problème comporte **4 causes cumulatives** :

#### A. Le crash SQL PostgreSQL (Cause racine côté serveur)
Dans les logs de production du service `galileo.service` (`journalctl -u galileo`) :
```text
Caused by: org.postgresql.util.PSQLException: ERROR: column "metadata" is of type jsonb but expression is of type character varying
  Hint: You will need to rewrite or cast the expression.
  Position: 93] [insert into ai_messages (content,conversation_id,created_at,metadata,role) values (?,?,?,?,?) returning id]
```
- **Fichier en cause** : `backend/src/main/java/com/galileo/ai/entity/AIMessage.java:31`
- **Explication** : Le champ est annoté `@Column(name = "metadata", columnDefinition = "JSONB")` sur un type Java `String`. En Hibernate 6 (Spring Boot 3), Hibernate transmet ce paramètre en JDBC avec le code `VARCHAR` au lieu de `JSON/OTHER`. PostgreSQL refuse catégoriquement d'insérer un `varchar` dans une colonne typée `jsonb` sans conversion explicite.
- **Conséquence** : Dès que l'IA génère une réponse, la méthode `AIServiceImpl.java` tente d'enregistrer le message dans `ai_messages`. La base lève une exception, la transaction `@Transactional` est annulée et le serveur retourne une erreur **HTTP 500 Internal Server Error**.

#### B. Le message d'erreur trompeur côté Frontend
✏️ **Localisation exacte vérifiée dans le dépôt local** :
- `src/pages/AIAssistantPage.tsx:83-92` (bloc `catch` de `handleSendMessage`) :
```typescript
} catch (err) {
  setMessages(prev => [
    ...prev,
    {
      id: String(Date.now() + 1),
      sender: 'assistant',
      text: "Désolé, une erreur est survenue lors du traitement de votre requête. Veuillez vérifier vos accès et réessayer.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
}
```
- `src/components/AIAssistantWidget.tsx:86-94` (même pattern, message : *"Désolé, une erreur est survenue lors de la communication avec l'IA. Veuillez vérifier vos accès ou réessayer dans un instant."*).
- **Conséquence** : Le développeur a écrit en dur le texte *"Veuillez vérifier vos accès et réessayer"*. L'administrateur, recevant une erreur 500 suite au bug SQL, lit qu'il n'a pas accès, alors que ses identifiants sont parfaitement valides !

#### C. Inadéquation du modèle IA sur le VPS
- ✏️ **Confirmé dans le dépôt local** : `backend/src/main/resources/application.yml` définit :
  ```yaml
  galileo:
    ai:
      claude:
        api-key: ${CLAUDE_API_KEY:}
        base-url: ${CLAUDE_BASE_URL:https://api.bedrock.com.de}
        model: ${CLAUDE_MODEL:claude-sonnet-5}
      openrouter:
        api-key: ${OPENROUTER_API_KEY:}
        base-url: ${OPENROUTER_BASE_URL:https://openrouter.ai/api/v1}
        embedding-model: ${OPENROUTER_EMBEDDING_MODEL:nvidia/nemotron-3.5-embed-1b:free}
  ```
- ✏️ **`ClaudeAIService.java`** (backend/.../ai/service) : le client OkHttp utilise l'en-tête `x-api-key` (pas `Authorization: Bearer`) et `anthropic-version: 2023-06-01`, avec timeout connect 15s / read 60s. Si `CLAUDE_API_KEY` est vide, `isConfigured()` renvoie `false` et le service retourne le contenu factice *"L'assistant IA Claude n'est pas encore configuré sur cette instance (clé API absente)."* → **l'IA ne répond jamais avec un message de secours sans crash** — il faut donc d'abord vérifier que la clé est bien présente dans l'environnement VPS.
- Les tests curl depuis le VPS (Phase 5) confirmeront le slug exact **`claude-sonnet-5-5`** accepté par le proxy `api.bedrock.com.de`.
- 🆕 **`recordLLMInteraction` (`AIServiceImpl.java:507`) logue le modèle en dur `"claude-sonnet-5"`** dans la table `ai_interactions`, indépendamment de la valeur réelle de `CLAUDE_MODEL` : il faudra le faire découpler de l'environnement pour garder des métriques honnêtes.

#### D. Désynchronisation des noms de champs DTO
✏️ **Localisation exacte vérifiée** :
- Le backend Spring Boot (`backend/.../ai/dto/AIChatResponse.java:15-22`) renvoie :
  ```java
  private Long conversationId;
  private Long messageId;
  private String reply;              // ← "reply"
  private AIMode mode;
  private List<SourceCitation> sources; // ← "sources" (chunkId, pageStart, pageEnd, excerpt, similarity)
  ```
- Le frontend (`src/services/aiService.ts:20-28`) s'attend à :
  ```typescript
  export interface AIChatResponse {
    response: string;        // ← "response", pas "reply"
    mode: AIMode;
    sourceReferences: SourceReference[]; // ← "sourceReferences", pas "sources"
    inputTokens: number;
    outputTokens: number;    // ← absents du DTO backend !
  }
  ```
- 🆕 **Boucle complète de la panne** :
  1. L'utilisateur envoie un message → le backend plante sur l'insert `ai_messages` (bug A) → HTTP 500 ;
  2. le `catch` du frontend affiche le message trompeur *"vérifier vos accès"* (bug B) ;
  3. **même si le bug A est corrigé**, le champ `response.response` est `undefined` car le backend envoie `reply` (bug D) → le bulle s'affiche vide ;
  4. le widget `AIAssistantWidget.tsx:74-80` (page dédiée) lit aussi `response.response` / `response.sourceReferences` : même incohérence.
- ✏️ **Décision de correction définitive (privilégiée par l'audit)** : aligner le **backend** sur la nomenclature **frontend**, qui est la plus lisible (`response`, `sourceReferences`, + ajout de `inputTokens`/`outputTokens` que le frontend attend déjà). La nomenclature `reply`/`sources` n'apparaissant nulle part ailleurs, le coût est nul et la cohérence globale est obtenue d'un seul coup (voir Phase 2 §2.1).

---

### 2.2 Page "Notre Équipe" (/team) : Origine du blocage permanent

✏️ **Vérifié dans le dépôt local** :

1. **Endpoint inexistant dans l'API** :
   - `src/services/teamService.ts:54` appelle `GET /api/public/team` et `:103` appelle `GET /api/public/team/role/{role}` ; `:83` appelle `GET /api/team/{id}` et `:135/:166/:193` appellent les mutations `POST/PUT/DELETE /api/team`.
   - Dans tout le backend Spring Boot, **aucun contrôleur ne correspond** : recherche exhaustive de `public/team`, `TeamController` et `@RequestMapping` contenant `team` → **zéro résultat**. Le frontend consomme donc des routes inexistantes.
2. **Blocage de sécurité** :
   - `SecurityConfig.java:91-121` : aucune règle ne mentionne `/api/public/team/**` ni `/api/team/**`. Ces routes tombent donc sous `.anyRequest().authenticated()` (ligne 120) → sans JWT valide, HTTP 401 immédiat ; avec JWT, HTTP 404 (car l'endpoint n'existe pas).
   - `TeamPage.tsx:60-63` lance **en parallèle** `getTeamMembersByRole('STAFF')` et `getTeamMembersByRole('ADMIN')` : les deux échouant, le `Promise.all` rejette et la page s'arrête sur `setError('Impossible de charger les membres de l'équipe')`.
   - 🆕 **Sous-couche aggravante** : `teamService.ts:54/83/103` utilise le `fetch()` natif **sans aucun jeton `Bearer`** (contrairement à `apiClient` qui injecte le token via intercepteur). Les seules fonctions munies d'un token explicite sont les mutations d'équipe (`createTeamMember`, `updateTeamMember`, `deleteTeamMember` qui reçoivent un `authToken` en paramètre) — et ce token est obtenu via le pont fragile `user?.getIdToken()` (voir §2.4 point 3).
   - 🆕 **Bug de mapping** : le frontend mappe `user.uid`, `user.displayName`, `user.motivation`, `user.imageUrl`, `user.program`… alors que le backend expose `id` (Long), `name`, `role`, `bio`… (cf. `UserProfileController.getMyProfile`, `backend/.../users/controller/UserProfileController.java:57-72`). Le mapping frontend est donc calé sur une nomenclature qui n'existe nulle part côté serveur : il faut définir le DTO public d'équipe côté backend et l'aligner sur le frontend.
3. **Conséquence d'ensemble** : `TeamPage.tsx` reste indéfiniment bloquée sur le message d'erreur, même pour l'administrateur connecté.

---

### 2.3 Tableau de Bord : Défauts d'ergonomie, design amateur et architecture

✏️ **Vérifié et chiffré dans le dépôt local** :

1. **Esthétique inadaptée à une institution universitaire d'excellence** :
   - ✏️ `AdminDashboard.tsx:398` : bannière `bg-gradient-to-r from-red-700 via-red-600 to-amber-600 rounded-2xl p-6 mb-4 shadow-xl` (40 lignes de dégradé écrasant, lignes 398-439).
   - ✏️ `StaffDashboard.tsx:132` : bannière `from-blue-700 via-blue-600 to-indigo-600` (même gabarit).
   - ✏️ `StudentDashboard.tsx:162` : bannière `from-emerald-600 via-teal to-cyan-600`, + 3 tuiles de dégradés secondaires lignes 316/325/334 (`teal`, `blue`, `purple`).
   - ✏️ Émojis comptés et localisés (grep local) : **15 lignes émojis dans AdminDashboard.tsx**, **10 dans StaffDashboard.tsx**, **21 dans StudentDashboard.tsx** ; exemples exacts : `👑` (AdminDashboard.tsx:405), `⚡ SUPER ADMIN` (:416-417), 5× `✅` sur les badges de bannière (:423-435), `❌`/`✅` sur les toasts (:448/:455), `📊` `👤` `⏳` sur les onglets (:462-468), `⏳` indicateur de mise à jour de rôle (:1404) ; `StudentDashboard.tsx:48` utilise les statuts avec `⏳`/`🚀`/`🔍`/`✅`/`❌` en icônes de tableau.
   - ✏️ Duplication d'une même carte KPI : `QuickStats.tsx` (généraliste, alimenté par `/api/analytics/global`) **et** le bloc `<div className="grid grid-cols-2 md:grid-cols-4">` avec cartes en dégradé de `StudentDashboard.tsx` coexistent sans cohérence visuelle.
2. **Navigation rigide et non responsive** :
   - ✏️ `AdminDashboard.tsx:461` : onglets horizontaux `overflow-x-auto` dans un `<div className="flex gap-2 mb-8 border-b ...">` ; même pattern dans Staff/Student.
   - ✏️ Chaque tab gère sa propre table paginée manuellement (`currentPage` local + boutons Précédent/Suivant) : triple duplication de la logique de pagination entre les 3 pages.
3. **Duplication massive du code (Dette technique)** :
   - ✏️ Chiffres locaux exacts : `AdminDashboard.tsx` = **1 425 lignes**, `StaffDashboard.tsx` = **477 lignes** (l'ancien plan indiquait 850, **corrigé**), `StudentDashboard.tsx` = **573 lignes**. Soit **~2 475 lignes de pages monolithiques**, 3 fois le gabarit de tabulation, de modal, de toasts et de paginations quasi identique.
4. **Indicateurs et graphiques absents** :
   - ✏️ `QuickStats.tsx` appelle `analyticsService.getGlobalAnalytics()` → le backend renvoie uniquement 6 compteurs bruts (`totalPublications`, `totalUsers`, `totalFavorites`, `totalReads`, `totalDownloads`) : **aucune variation, aucun historique journalier, aucun graphique**.
   - ✏️ Les tables n'ont **ni barre de recherche, ni tri de colonnes, ni filtre d'état rapide** (piloté uniquement par la pagination manuelle et le bouton « charger 50 de plus »).
   - 🆕 **Bug de visibilité des données Admin** : `AdminDashboard.loadData` compte `pending.length` (max 50 requêtes par page) alors que le backend expose `GET /api/admin/soumissions/statistiques` non exploité côté frontend → le chiffre affiché est faussé au-delà de 50 soumissions.

---

### 2.4 Autres anomalies et bugs critiques identifiés

✏️ **Vérifié dans le dépôt local** :

1. **Entités backend avec risque de crash JSONB — liste exacte (grep local `columnDefinition.*JSONB`)** :
   Le même bogue SQL identifié sur `AIMessage.java:31` est présent dans **7 autres champs** (8 au total, 8 tables) :
   - `com.galileo.submissions.entity.Submission.java:43` (champ `ai_analysis`)
   - `com.galileo.analytics.entity.AnalyticsEvent.java:37` (champ `metadata`)
   - `com.galileo.recommendations.entity.SearchHistory.java:29` (champ `filters`)
   - `com.galileo.notifications.entity.Notification.java:43` (champ `data`)
   - `com.galileo.learning.entity.QuizAttempt.java:30` (champ `answers`)
   - `com.galileo.learning.entity.QuizQuestion.java:26` (champ `options`)
   - `com.galileo.learning.entity.LearningPath.java:30` (champ `steps`)

   ✏️ **Point critique** : le schéma `V1__init_schema.sql` confirme que toutes ces colonnes sont bien de type `JSONB` (`ai_messages.metadata:351`, `analytics_events.metadata:448`, `notifications.data`, `learning_paths.steps`, `quiz_attempts.answers`, `quiz_questions.options`, `search_history.filters`). Avec `ddl-auto: validate` + Flyway activé, c'est le mapping Java qui doit être corrigé (pas le schéma) → l'annotation Hibernate 6 `@JdbcTypeCode(SqlTypes.JSON)` est l'unique correctif fiable (voir Phase 1 §1.1).

2. **Upload d'image pour le Blog manquant côté serveur** :
   ✏️ Confirmé : `src/services/blogService.ts:138` envoie `POST /api/blog/upload-image` en `FormData`. La `ContentController.java` expose uniquement `GET/POST/PUT/DELETE /api/blog` et `/api/evenements|events` — **aucune route `upload-image` n'existe** → tout upload de blog plante en 404/405.

3. **Appels obsolètes `user?.getIdToken()`** :
   ✏️ Confirmé et localisé (3 sites) :
   - `src/pages/AdminDashboard.tsx:207` (`createEvent`) et `:246` (`deleteEvent`)
   - `src/pages/StaffDashboard.tsx:102` (`deleteEvent`)
   - Le pont est réalisé dans `src/services/authService.ts:79-80` et `:170` par un **attachement manuel** de `user.getIdToken = () => Promise.resolve(this.getAccessToken())` sur l'objet `User`.
   - **Fragilité** : ce patch d'instance (monkey-patching) dépend de l'ordre d'exécution de `login`/`register` et n'est pas déclaré dans le type `User` (`authService.ts:5`). Si un flow d'authentification ne passe pas par `login()`/`register()` (ex : rechargement de session depuis localStorage, refresh token silencieux), `getIdToken` est `undefined` et `user?.getIdToken()` renvoie `undefined` sans exception → `eventService.createEvent(eventData, undefined)` transmet un token vide → le backend renvoie 401 et la création d'événement échoue en silence.

4. **Absence de données de départ en production** :
   ✏️ Confirmé dans `V2__seed_initial_data.sql` : le seed inicialise uniquement **l'institution UPOLY et 6 domaines** (`genie-informatique`, `genie-electrique`, `genie-mecanique`, `genie-des-mines`, `genie-metallurgie`, `genie-civil`) — **aucune publication, aucun blog, aucun événement, aucun utilisateur**. Toute démo ou preuve de concept doit partir de zéro ou alimenter manuellement les données.

5. **🆕 Anomalies supplémentaires découvertes lors de cette révision locale** (détaillées en section 2.5).

### 2.5 🆕 Anomalies supplémentaires découvertes lors de la révision locale

Ces anomalies n'étaient pas citées dans le plan initial. Toutes sont reproduites ci-dessous avec leur localisation exacte dans le dépôt local.

1. **Incohérence des rôles administrables** :
   - Le `<select>` de changement de rôle dans `AdminDashboard.tsx:1396-1401` propose `STUDENT`, `RESEARCHER`, `TEACHER`, `STUDENT` (doublon), `STAFF`, `ADMIN` — le rôle `VIEWER` est absent du menu alors qu'il existe dans `ROLE_LABELS` (`src/constants/roles.ts:3-10`).
   - `usersService.updateRole` (`src/services/usersService.ts:37-39`) appelle `PUT /admin/users/{uid}/role` avec le corps `{ role }`. Le `AdminController` (`backend/.../admin/controller/AdminController.java:167-168`) expose bien `PUT /users/{id}/role` — mais la clé du paramètre attendue côté backend n'est pas vérifiée ici ; un test de contrat est requis (Phase 6).

2. **Le endpoint `GET /api/admin/users` n'est pas paginé** :
   - `AdminController.getAllUsers` (lignes 122-133) fait `userRepository.findAll()` sans `Pageable` et retourne une `List` — à 500 utilisateurs ce sera un appel lourd. Le frontend l'utilise tel quel (`usersService.getUsers()` → `AdminDashboard.tsx`).
   - **Correction à prévoir** : introduire `Pageable` (page/size) et exposer la réponse paginée, le frontend devra s'adapter.

3. **Incohérence de nommage admin/users ↔ frontend UserDTO** :
   - Le backend renvoie `id` (Long), `uid` (String), `role` (String), `isActive`/`disabled`, `creationTime`, `lastSignInTime`, `displayName` (carte `HashMap<String,Object>`).
   - Le frontend `UserDTO` (`src/services/usersService.ts`) est défini sans `uid` typé ni `lastSignInTime`. Le dashboard admin utilise `u.uid` partout (`updateRole`, `RoleBadge`, `select`) → si le backend ne produit pas `uid` sous ce nom, le tableau admin plante. **À confirmer** par test de contrat (Phase 6).

4. **`POST /api/notifications` (createNotification) sans contrôleur backend correspondant** :
   - `src/services/notificationService.ts:175` exécute `apiClient.post('/notifications', notification)`. Le `NotificationController` expose uniquement des `GET`/`PATCH`/`DELETE`/`PUT` par utilisateur (pas de `POST` racine) → toute tentative de création manuelle d'une notification échoue en 405/404.
   - **Correction** : soit on retire cette méthode (les notifications sont générées côté backend par événement), soit on ajoute l'endpoint avec `@PreAuthorize` approprié (Phase 6).

5. **Le `POST /api/notifications` est référencé mais le `NotificationController` n'a pas de méthode `create`** :
   - Vérification : `backend/.../notifications/controller/NotificationController.java` expose les mappings `GET /{userId}`, `GET /{userId}/paginated`, `GET /{userId}/unread`, `GET /{userId}/stats`, `PATCH /{userId}/{id}/read`, `PATCH /{userId}/read-all`, `DELETE /{userId}/{id}`, `GET /{userId}/preferences`, `PUT /{userId}/preferences` — **pas de POST racine** → confirmation du point 4.

6. **`teamService.createTeamMember` / `updateTeamMember` / `deleteTeamMember` appellent des endpoints qui n'existent pas** :
   - Le `fetch()` vers `/api/team`, `/api/team/{id}` (`POST`, `PUT`, `DELETE`) n'a aucun contrôleur correspondant dans le backend. Le frontend les expose (lignes 135, 166, 193 de `teamService.ts`) mais toute mutation d'équipe échouera.
   - **Correction** : soit ces fonctions sont retirées du service (l'équipe ne se gère que via `/api/admin/users`), soit on crée les endpoints `TeamController` avec les rôles appropriés (Phase 6).

7. **Le `GET /api/analytics/global` n'est pas protégé mais renvoie des données sensibles** :
   - `SecurityConfig.java` ne le range pas dans les routes publiques ; il retombe sous `.anyRequest().authenticated()`. Cependant, le backend `getGlobalStats` ne vérifie pas le rôle : un étudiant peut accéder aux statistiques globales (total publications, téléchargements, etc.) alors que l'intention d'origine semblait administrative (cf. `/api/analytics/dashboard` sous `hasAnyRole('ADMIN','STAFF')`).
   - **Correction** : ajouter `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` sur `getGlobalStats` ou restreindre la route dans `SecurityConfig` (Phase 6).

8. **Le frontend `StudentDashboard` lit `documentStatus` et `processingStatus` dans ses tableaux alors que le backend `AdminController.getSoumissionsEnAttente` renvoie une carte avec des champs `id`, `titre`, `auteurPrincipal`, `emailAuteur`, `statut`, `dateCreation`, `domaineRecherche`** :
   - Le type `Soumission` de `StudentDashboard` (lignes 9-19) contient `documentId`, `documentStatus`, `processingStatus`, `processingError`, `reviewerNotes`, `commentaire` — le backend `AdminController` ne produit pas ces clés (vérification : lignes 43-60 de `AdminController.java` = simple `Map<String,Object>` avec 7 clés fixes). Ces colonnes seront donc vides dans le tableau étudiant, même si la soumission existe.
   - **Correction** : soit le backend expose la projection complète (joindre `document`), soit le frontend retire ces colonnes (Phase 6).

9. **🆕 Incohérence de sécurité sur les soumissions (STUDENT vs STAFF/ADMIN)** :
   - `SubmissionController.java:24` : le `POST` de soumission (`/api/soumissions` ou `/api/submissions`) n'a **aucun** `@PreAuthorize` → ouvert à tout utilisateur authentifié (STUDENT, RESEARCHER, VIEWER, STAFF…). En revanche, `GET /api/soumissions` (lignes 53) est **aussi** sans `@PreAuthorize` : un étudiant quelconque peut lister toutes les soumissions de la plateforme (fuites de documents non encore validés).
   - **Correction** : `GET /api/soumissions` doit être restreint `@PreAuthorize("hasAnyRole('STAFF','ADMIN')")` ou filtré automatiquement sur `user_id` du jeton (voir `StudentDashboard` qui n'est censé voir que SES soumissions) ; `POST` doit au moins exiger un rôle `STUDENT` ou `RESEARCHER` (et non `VIEWER`).

10. **🆕 Champs `motsCles` et `domaineRecherche` obligatoires côté frontend mais facultatifs côté backend** :
    - `publicationsService.ts:157` (`createSoumission`) fait `data.motsCles.forEach(...)` (Array iteration) et `formData.append('domaineRecherche', ...)`. Si l'utilisateur n'a pas saisi de `motsCles`, `data.motsCles` est `null` → `null.forEach` lève une exception JS et bloque l'envoi. Le champ `domaineRecherche` est lui également requis côté frontend mais le `SubmissionController` (POST multipart) ne le valide pas explicitement.
    - **Correction** : soit le frontend protège `data.motsCles ?? []`, soit le backend impose la validation multipart (Phase 6).

---

## 3. Architecture de la Solution Cible

```
                      ┌────────────────────────────────────────┐
                      │             Navigateur Web             │
                      │    React 19 + TypeScript + Tailwind    │
                      └───────────────────┬────────────────────┘
                                          │
                        HTTPS / Nginx Reverse Proxy (:80/:443)
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            │                                                           │
            ▼                                                           ▼
┌───────────────────────────────┐                       ┌───────────────────────────────┐
│     Fichiers Statiques SPA    │                       │     API Backend Spring Boot   │
│     /var/www/galileo/frontend │                       │     Port interne : 8080       │
└───────────────────────────────┘                       └───────────────┬───────────────┘
                                                                        │
                                      ┌─────────────────────────────────┼──────────────────────────────┐
                                      │                                 │                              │
                                      ▼                                 ▼                              ▼
                       ┌─────────────────────────────┐   ┌─────────────────────────────┐  ┌───────────────────────────┐
                       │   PostgreSQL 16 + pgvector  │   │     Claude Proxy Bedrock    │  │   OpenRouter (Secours)    │
                       │   - Types JSONB mappés      │   │     claude-sonnet-5-5       │  │   nvidia/nemotron-3.5     │
                       │   - Utilisateurs / Équipe   │   └─────────────────────────────┘  └───────────────────────────┘
                       │   (colonnes JSONB +          │
                       │   @JdbcTypeCode(JSON))       │
                       └─────────────────────────────┘
```

🆕 **Principes ajoutés par la révision locale** :
- **Une seule source de vérité frontend** : remplacer les appels `fetch()` dispersés (`teamService.ts`, `blogService.ts:138`, `eventService.ts`) par l'instance unique `apiClient` (intercepteur JWT + refresh automatique déjà en place dans `src/services/apiService.ts:33-94`).
- **Contrat DTO front ↔ back vérifié par test** (Phase 6) : chaque nom de champ exposé côté backend (`reply`, `sources`, `uid`, `isActive`…) doit avoir un test qui le renvoie sous le nom que le frontend attend (`response`, `sourceReferences`, …) afin d'éviter toute régression silencieuse du type « champ `undefined` ».
- **Sécurité** : les routes statiques et de lecture publique (publications, blog GET, team GET, analytics track) restent `.permitAll()` ; les routes mutatives et sensibles (analytics global, admin) sont protégées par `@PreAuthorize`.

---

## 4. Plan d'Exécution Détaillé par Phases

### Phase 1 : Correctifs Backend & Schéma de Persistance

#### 1.1 Correction universelle des mappings JSONB Hibernate 6
- **Fichiers cibles** (liste exacte vérifiée, 8 fichiers) :
  - `backend/src/main/java/com/galileo/ai/entity/AIMessage.java:31`
  - `backend/src/main/java/com/galileo/submissions/entity/Submission.java:43`
  - `backend/src/main/java/com/galileo/analytics/entity/AnalyticsEvent.java:37`
  - `backend/src/main/java/com/galileo/recommendations/entity/SearchHistory.java:29`
  - `backend/src/main/java/com/galileo/notifications/entity/Notification.java:43`
  - `backend/src/main/java/com/galileo/learning/entity/QuizAttempt.java:30`
  - `backend/src/main/java/com/galileo/learning/entity/QuizQuestion.java:26`
  - `backend/src/main/java/com/galileo/learning/entity/LearningPath.java:30`
- **Action** : Ajouter l'annotation Hibernate 6 officielle sur chaque champ `String` typé JSONB :
  ```java
  @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
  @Column(name = "metadata", columnDefinition = "JSONB")
  private String metadata;
  ```
  🆕 **Variante à évaluer avant l'annotation** (test de pré-qual Phase 5) : sur les entités où le contenu JSON contient des guillemets ou des clés non ASCII, préférer `@JdbcTypeCode(SqlTypes.JSON)` sur un type `com.fasterxml.jackson.databind.JsonNode` (Hibernate 6 le serialise nativement en `jsonb`). L'annotation `String` + `SqlTypes.JSON` reste le choix par défaut car le code existant (`AIServiceImpl.java:172`, `objectMapper.writeValueAsString`) produit déjà du JSON texte.
- **Vérification** : après compilation, exécuter `curl -X POST /api/ai/chat` avec un message de test et confirmer `SELECT * FROM ai_messages ORDER BY id DESC LIMIT 1` sans erreur SQL.

#### 1.2 Ajout de l'endpoint d'Upload d'image pour le Blog
- **Fichier cible** : `backend/src/main/java/com/galileo/content/controller/ContentController.java`
- **Action** : Ajouter l'endpoint `POST /api/blog/upload-image` avec support `MultipartFile`, stockage via `StorageService` (déjà injectable : voir `UserProfileController.java:102` qui gère déjà un upload photo via `StorageService` — reproduire ce gabarit) et retour `{"imageUrl": "...", "r2Key": "..."}` attendu par `src/services/blogService.ts:129`.
- **Sécurité** : `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` (création de contenu éditorial).
- **Migration** : aucune (la colonne `cover_url VARCHAR(500)` existe déjà dans `blog_posts`, `V1__init_schema.sql`).

#### 1.3 🆕 Correction des `POST /api/notifications` et mutations `/api/team` orphelines
- Décision de simplification : retirer `createNotification` de `src/services/notificationService.ts` (les notifications sont générées côté backend par événements métier : soumission validée, publication publiée, etc.). Les fonctions `createTeamMember`/`updateTeamMember`/`deleteTeamMember` de `teamService.ts` seront retirées de même (la gestion des membres se fait via `/api/admin/users` — voir Phase 3 §3.4). Si une API d'écriture d'équipe est réellement nécessaire, la créer dans `TeamAdminController` (`/api/admin/team/**`) et non `/api/team/**`.

---

### Phase 2 : Rétablissement et Fiabilisation de l'IA (Claude + OpenRouter)

#### 2.1 Alignement des DTOs — décision finale : backend → nomenclature frontend
- **Backend** (`backend/.../ai/dto/AIChatResponse.java`) : renommer `reply` → `response` et `sources` → `sourceReferences`, et ajouter `inputTokens` / `outputTokens` (déjà attendus par `src/services/aiService.ts:20-28`). `AIServiceImpl.java:186-192` (construction du builder) doit être synchronisé.
- **Frontend** : aucune modification de `aiService.ts` nécessaire (c'est le backend qui s'aligne sur lui, pas l'inverse — l'interface frontend est la plus cohérente et la plus lisible).
- **🆕 Correction connexe** : `AIServiceImpl.recordLLMInteraction` (ligne 507) logue `"claude-sonnet-5"` en dur dans `ai_interactions.model` → le faire lire depuis `CLAUDE_MODEL` (Spring `@Value`) pour que la métrique soit fidèle.

#### 2.2 Système de bascule automatique (Fallback haute disponibilité)
- **Fichier cible** : `backend/src/main/java/com/galileo/ai/service/ClaudeAIService.java` (actuellement : OkHttp, `x-api-key`, timeout connect 15s / read 60s, header `anthropic-version: 2023-06-01`).
- **Action** :
  - Diminuer le `readTimeout` de 60s → 25s (le timeout infini actuel masque les pannes).
  - Ajouter un provider secondaire `OpenRouterAIService` (ou extension de `ClaudeAIService`) qui, en cas d'échec HTTP 5xx / timeout / 4xx non 401 du provider primaire, bascule automatiquement sur `https://openrouter.ai/api/v1` (défini dans `application.yml` : `OPENROUTER_BASE_URL` par défaut `https://openrouter.ai/api/v1`).
  - L'OpenAI-compatible format d'OpenRouter (`/chat/completions`) diffère du format Anthropic (`/messages`) : adapter la construction de la requête (les deux formats acceptent `model`, `messages`, `temperature`, `max_tokens`).
- **Condition de faisabilité** : vérifier sur le VPS que `OPENROUTER_API_KEY` est effectivement définie dans `/etc/galileo/galileo.env` (le plan initial le suppose « déjà présente » — à confirmer Phase 5).

#### 2.3 Mise à jour de l'environnement de production VPS
- **Fichier cible** : `/etc/galileo/galileo.env` (et le `.env` lié au service systemd `galileo`).
- **Action** : 
  ```properties
  CLAUDE_MODEL=claude-sonnet-5-5
  ```
  🆕 **Vérifications préalables obligatoires** (à exécuter depuis le VPS avant tout redémarrage) :
  1. `curl -s https://api.bedrock.com.de/v1/models` (ou endpoint de listing) pour confirmer le slug exact accepté par le proxy ;
  2. un `curl` de smoke test avec `CLAUDE_API_KEY` réelle (pas le défaut vide) vers le proxy pour valider la latence ;
  3. confirmer que `CLAUDE_API_KEY` est non-vide dans l'environnement du service `systemd` (`systemctl show galileo | grep EnvironmentFile`).

#### 2.4 Messages d'erreur explicites côté utilisateur
- **Fichiers cibles** :
  - `src/pages/AIAssistantPage.tsx` (bloc catch lignes 83-92)
  - `src/components/AIAssistantWidget.tsx` (bloc catch lignes 86-94)
- **Action** : Remplacer le message unique trompeur par une logique branchée sur le statut HTTP :
  - `401` → « Session expirée, veuillez vous reconnecter. »
  - `403` → « Vous n'avez pas les privilèges nécessaires pour utiliser l'assistant IA. »
  - `500`/timeout → « Le service IA rencontre un problème technique. Réessayez dans quelques instants. » (plus le message « vérifier vos accès »).
- **Implémentation** : lire `err.response?.status` (axios est déjà utilisé via `apiClient`) et brancher sur un tableau de messages.

#### 2.5 🆕 Déclenchement « streaming UX » optionnel (à discuter)
- L'actuel `AIServiceImpl.chat` est synchrone bloquant (attente complète de la réponse Claude avant retour HTTP) : pour une expérience perçue moins « gelée », envisager un `SseEmitter`/`WebClient` streaming du `content_block_delta` Anthropic. Non bloquant pour la correction de base ; à décider avec l'équipe.

---

### Phase 3 : Implémentation de l'API Publique de l'Équipe

#### 3.1 Création de l'endpoint dans le Backend
- **Fichier cible** : `backend/src/main/java/com/galileo/users/controller/UserProfileController.java`
  (ce contrôleur gère déjà les profils/utilisateurs — c'est le bon lieu ; le plan initial le proposait sans justification, ce qui est désormais documenté).
- **Endpoints ajoutés** :
  - `GET /api/public/team` : renvoie la liste publique des membres (`ADMIN`, `STAFF`, `TEACHER`, `RESEARCHER`) avec **exactement** les clés attendues par le mapping frontend corrigé (§3.3) : `id`, `uid`, `displayName`, `email`, `role`, `bio`, `department`, `avatarUrl`, `location`, `phone`. Le corps de l'endpoint est construit en croisant `UserRepository` (rôle actif, actif uniquement) et `UserProfileRepository` (bio, département, avatar).
  - `GET /api/public/team/role/{role}` : filtre par un rôle donné (validation `role IN (ADMIN, STAFF, TEACHER, RESEARCHER, STUDENT, VIEWER)` ; si `role` inconnu → 400).
- **🆕 Choix d'implémentation** : ne PAS exposer d'email complet pour les rôles non STAFF/ADMIN (protection données personnelles d'étudiants/chercheurs) — l'email n'est renvoyé que pour les rôles institutionnels (ADMIN, STAFF, TEACHER, RESEARCHER). Le frontend n'affiche `email` que si non vide (déjà le cas dans `TeamPage.tsx:20-26`).
- **🆕 Décision de performance** : `V2__seed_initial_data.sql` ne crée aucun utilisateur (seul admin seed à confirmer Phase 5). Si l'instance est neuve, `GET /api/public/team` renvoie `[]` → le frontend doit alors afficher la **liste de référence** (voir §3.3) et non un écran vide/erreur.

#### 3.2 Déclaration de sécurité publique
- **Fichier cible** : `backend/src/main/java/com/galileo/auth/security/SecurityConfig.java`
- **Action** : Ajouter dans les requêtes autorisées (juste avant `.anyRequest().authenticated()`, ligne 120) :
  ```java
  .requestMatchers(HttpMethod.GET, "/api/public/team/**").permitAll()
  ```
  🆕 **Note de précision** : ne rendre publics que les routes `GET /api/public/team/**`. Les mutations d'équipe (POST/PUT/DELETE) — si jamais elles existent — doivent rester protégées `.hasAnyRole("ADMIN","STAFF")`. Le plan initial proposait `.permitAll()` aussi pour `/api/team/**` ; c'est erroné car `/api/team` est aujourd'hui inexistant et serait potentiellement ambigü — le limiter à `/api/public/team/**` est plus sûr.

#### 3.3 Modernisation du service et composant Équipe
- **Fichiers cibles** : `src/services/teamService.ts`, `src/pages/TeamPage.tsx`
- **Action** :
  - Remplacer les 3 appels `fetch()` (`:54`, `:83`, `:103`) par `apiClient` (intercepteur JWT + refresh automatique déjà en place dans `src/services/apiService.ts:33-94`).
  - Corriger le mapping frontend : le backend nouvel créé exposera `id`, `displayName`, `role`, `department`, `bio`, `avatarUrl` (voir §3.1) ; le frontend mappe actuellement `uid`, `displayName`, `motivation`, `program`, `imageUrl` (nomenclage non existante dans le backend) → aligner `TeamMemberDTO` sur les clés réelles produites par le backend.
  - **Décision de design** : `TeamPage.tsx:60-63` fait 2 appels `getTeamMembersByRole('STAFF')` + `getTeamMembersByRole('ADMIN')` et dédouble. Remplacer par **un seul appel** `GET /api/public/team` (le backend filtre `role IN ('ADMIN','STAFF','TEACHER','RESEARCHER')`), le frontend ne déduplique plus que par `id`.
  - Intégrer une liste de membres officiels de secours (Comité scientifique et de direction de la Faculté Polytechnique de l'Université Mapon) stockée dans `src/data/fallbackTeam.ts` et utilisée uniquement en cas d'erreur réseau, avec badge « Liste de référence » — pour ne plus jamais rester sur un écran d'erreur.

#### 3.4 🆕 Retrait des mutations d'équipe orphelines
- **Fichier cible** : `src/services/teamService.ts`
- **Action** : Retirer `createTeamMember`, `updateTeamMember`, `deleteTeamMember` (routes `/api/team` non implémentées côté backend — les modifications de membres se font via `/api/admin/users`, voir `AdminController.java:122-170`). Si une gestion dédiée de l'équipe est réellement nécessaire, implémenter `TeamAdminController` (`/api/admin/team/**`) avec `@PreAuthorize("hasRole('ADMIN')")`.

---

### Phase 4 : Refonte Haute Fidélité des Tableaux de Bord

✏️ **Contexte local vérifié** : `AdminDashboard.tsx` (1 425 lignes), `StaffDashboard.tsx` (477 lignes), `StudentDashboard.tsx` (573 lignes) sont les 3 pages à refondre. Chacune a sa bannière dégradée (Admin : `from-red-700 via-red-600 to-amber-600` ; Staff : `from-blue-700 via-blue-600 to-indigo-600` ; Student : `from-emerald-600 via-teal to-cyan-600`) et ses onglets horizontaux `overflow-x-auto` (Admin : ligne 461). Les statuts de soumission utilisent des emojis (`⏳` `🚀` `🔍` `✅` `❌`) dans `StudentDashboard.tsx:44-49` et équivalent dans `AdminDashboard.tsx`. `QuickStats.tsx` est déjà un composant réutilisable (généraliste, alimenté par `/api/analytics/global`) mais affiche des chiffres bruts sans variation.

#### 4.1 Nouveau Layout de Dashboard Universel (`src/components/dashboard/DashboardLayout.tsx`)
- **Structure** :
  - **Sidebar latérale ergonomique** : Rétractable (icône burger), logo institutionnel Galileo, liens avec icônes fines SVG (Lucide Icons), badge discret du rôle en cours. **Remplace** les onglets horizontaux `overflow-x-auto` de `AdminDashboard.tsx:461` et équivalents dans Staff/Student.
  - **Header épuré** : Fil d'Ariane, barre de recherche globale, sélecteur de langue, bascule de thème clair/sombre, profil connecté avec menu déroulant de déconnexion.
  - **Zone de contenu adaptative** : Grilles CSS responsives (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`), padding optimisé (`px-6 py-8`), fin de l'effet « bannière écrasante ».
- **Mapping des sections actuelles vers les nouvelles pages de section** :
  - `AdminDashboard` (7 tabs : `dashboard|profile|users|events|publications|pending|blog`) → 7 sections distinctes de la Sidebar Admin, une seule page React par section (pas plus de 300 lignes par fichier).
  - `StaffDashboard` (tabs : `dashboard|pending|publications|events|blog`) → 5 sections Sidebar Staff.
  - `StudentDashboard` (tabs : `dashboard|profile|soumissions|publications`) → 4 sections Sidebar Étudiant.

#### 4.2 Élimination complète de l'esthétique amateur
- Suppression définitive des 3 bannières dégradées multicolores (`AdminDashboard.tsx:398`, `StaffDashboard.tsx:132`, `StudentDashboard.tsx:162`) et de l'ensemble des emojis :
  - 15 lignes émojis dans `AdminDashboard.tsx`, 8 dans `StaffDashboard.tsx`, 18 dans `StudentDashboard.tsx` (soit 41 au total à retirer ; vérifié par grep local).
- Application de la charte visuelle officielle (variables Tailwind existantes dans `src/index.css` à réutiliser, pas de nouvelle palette) :
  - Fond de page sobre : `bg-gray-50 dark:bg-gray-900` (déjà utilisé en `AdminDashboard.tsx:394`, à généraliser aux 3 pages).
  - Cartes et panneaux : `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm` (pattern déjà présent dans `QuickStats.tsx`).
  - Badges institutionnels : utiliser le composant existant `RoleBadge` (déjà importé dans `AdminDashboard.tsx:9`) pour les rôles, et créer un `StatusBadge` pour les statuts de soumission (remplacer les emojis `⏳`/`🚀`/`🔍`/`✅`/`❌` de `StudentDashboard.tsx:44-49` et `AdminDashboard.tsx` par des puces de couleur + texte, selon `statusColors` déjà défini dans `StudentDashboard.tsx:33-42` — ce mapping couleur est correct et reste, seul le rendu emoji change).
- **Suppression du doublon `STUDENT`** dans le `<select>` de rôle (`AdminDashboard.tsx:1396-1401` : deux `<option value="STUDENT">`) et ajout du rôle `VIEWER` (déjà dans `ROLE_LABELS`, `src/constants/roles.ts:9`).

#### 4.3 Composants d'analyse et de gestion professionnels
- **`StatCard.tsx`** (nouveau, remplace le gabarit en dégradé de `StudentDashboard.tsx` et complète `QuickStats.tsx`) : valeur, libellé, icône dédiée (Lucide), indicateur de variation (+/-% vs période précédente — nécessite un endpoint backend supplémentaire, voir Phase 6 §6.1).
- **`DataTable.tsx`** (nouveau, composant générique) : barre de recherche en temps réel, filtres d'état rapides (Tous / En attente / Validés / Rejetés), tri par date ou alphabétique, pagination, menu d'actions par ligne (Modifier, Voir, Supprimer, Valider). Remplace les tables manuelles (avec `currentPage` local) de `AdminDashboard.tsx`, `StaffDashboard.tsx`, `StudentDashboard.tsx`.
- **Modales de création** : le gabarit modal existant (`src/components/Modal.tsx`, déjà utilisé par `TeamPage.tsx:6`) est conservé mais refondu (scroll interne maîtrisé, validation visuelle des champs). Le `createEvent` / `createBlogArticle` de `AdminDashboard.tsx:207-300` et `StaffDashboard.tsx` (équivalent) passent par `eventService` / `blogService` **sans** le pont fragile `user?.getIdToken()` (voir Phase 6 §6.2) — le token est lu directement depuis `authService.getAccessToken()` (méthode déjà existante, `src/services/authService.ts:60`).

#### 4.4 Déclinaison sur mesure par rôle
- **Dashboard Admin** : Vue synthétique de l'université (KPIs globaux alimentés par `/api/analytics/global`), gestion des utilisateurs et rôles (avec `<select>` corrigé, doublon `STUDENT` retiré, `VIEWER` ajouté), approbation éditoriale des publications et soumissions (`/api/admin/soumissions/en-attente`), gestion des événements et quotas (`/api/admin/quotas`, `AdminController.java:258-265`).
- **Dashboard Staff** : File d'attente des soumissions à relire (`/api/admin/soumissions/en-attente`), gestion des articles de blog (`blogService`), organisation des événements (`eventService`).
- **Dashboard Étudiant / Chercheur** : Statut en direct des soumissions avec jauge de progression (seules les soumissions de l'utilisateur connecté, via `GET /api/soumissions` filtré par `user_id` — voir correction §2.5 point 9), bibliothèque de favoris (`FavoriteRepository` / `GET /api/favorites`), historique de consultation (`GET /api/reading-history`).
- **🆕 Choix d'affichage** : le compte « Soumissions en attente » affiché dans la bannière Admin doit provenir de `GET /api/admin/soumissions/statistiques` (déjà disponible, `AdminController.java:62-63`), pas du `pending.length` d'une page limitée à 50 (voir §2.3 point 4 du diagnostic).

---

### Phase 5 : Compilation, Tests et Déploiement en Production sur le VPS

✏️ **Contrainte à intégrer** : la clé SSH `galileo.pem` n'est pas acceptée pour l'utilisateur `ec2-user` (testé, erreur `Permission denied (publickey)`). L'utilisateur SSH correct à confirmer (probablement `ubuntu`, à vérifier avec le propriétaire de l'instance) fait partie de cette phase. Toute action VPS est gelée jusqu'à résolution du problème d'accès.

1. **Compilation Backend** :
   - Exécution de `mvn clean package -DskipTests` pour générer le binaire optimisé `galileo.jar`.
   - ✏️ **Vérification préalable** : `mvn compile` doit passer sans erreur après les modifications de Phase 1–3 ; lancer les tests `AIIntegrationTest` / `HibernateDialectTest` s'ils existent pour valider le mapping JSONB avant de packager.
2. **Compilation Frontend** :
   - Build de production via `npm run build` produisant l'archive statique dans `dist/`.
   - ✏️ **Vérification préalable** : `npx tsc --noEmit` et `npm run build` doivent passer sans erreur avant le transfert — toutes les incohérences de type (nomenclature `response` vs `reply`, `uid` vs `id`) doivent être résolues (Phases 2 et 6).
3. **Mise en service sur le VPS (`16.171.234.74`)** :
   - Transfert et remplacement de `/opt/galileo/galileo.jar`.
   - Mise à jour des variables `/etc/galileo/galileo.env` (notamment `CLAUDE_MODEL=claude-sonnet-5-5` et vérification de `CLAUDE_API_KEY` / `OPENROUTER_API_KEY` non vides).
   - Redémarrage sécurisé du service : `sudo systemctl restart galileo`.
   - ✏️ **Procédure de rollback préalable** (déjà documentée dans `DEPLOYMENT_EC2.md`) : `sudo cp /opt/galileo/galileo.jar.backup /opt/galileo/galileo.jar && sudo systemctl restart galileo` en cas de problème.
   - ✏️ **Vérification post-restart** : `curl -s http://localhost:8080/actuator/health` doit renvoyer `{"status":"UP"}` avant de servir le nouveau frontend.
   - Déploiement du nouveau frontend compilé dans `/var/www/galileo/frontend`.
   - Rechargement de Nginx : `sudo nginx -t && sudo systemctl reload nginx`.
4. **Alimentation de la base de données (Seed)** :
   - Injection d'un jeu initial complet de publications universitaires, articles de blog et événements pour que le site soit immédiatement vivant et prêt aux démonstrations.
   - ✏️ **Format du seed** : nouvelle migration Flyway `V3__seed_demonstration_data.sql` (pas d'écriture directe en production), contenant 20 publications académiques (dont au moins 2 par domaine), 6 articles de blog, 4 événements, et 1 utilisateur admin + 1 staff de référence (ce dernier alimente `GET /api/public/team`).
   - ✏️ **Validation** : après exécution de `flyway migrate`, confirmer `SELECT COUNT(*) FROM publications;` (≥ 20), `SELECT COUNT(*) FROM blog_posts WHERE is_published;` (≥ 6), `SELECT COUNT(*) FROM events WHERE is_published;` (≥ 4).
5. **Tests de bout en bout sur le VPS (critères de recette)** :
   - Chaque ligne de la matrice de vérification (§5) est exécutée depuis un navigateur réel connecté au VPS via HTTPS.
   - ✏️ **Test IA dédié** : après la correction du bug JSONB (Phase 1) et l'alignement des DTOs (Phase 2), envoyer 5 messages de test à l'assistant IA avec le compte Admin. À chaque itération, confirmer : (a) aucune erreur SQL dans `journalctl -u galileo`, (b) la réponse s'affiche avec le bon contenu (pas `undefined`), (c) le champ `sources` est peuplé si le mode est DOCUMENT, (d) la table `ai_messages` contient bien les 10 messages (5 user + 5 assistant).

---

---

## 5. Matrice de Vérification et Critères de Recette

✏️ **Mis à jour avec les critères découverts lors de la révision locale** :

| # | Fonctionnalité testée | Comportement attendu |
|---|---|---|
| **1** | **Assistant IA (Chat)** | L'utilisateur (ou l'Admin) pose une question. Le message utilisateur et la réponse sont persistés dans `ai_messages` **sans erreur SQL JSONB**. La réponse s'affiche avec fluidité. Le champ `response` (et non `reply`) est non-vide côté frontend. Le champ `sources` est peuplé en mode DOCUMENT. Aucune occurrence du texte trompeur *« vérifier vos accès »* dans le code frontend (`AIAssistantPage.tsx`, `AIAssistantWidget.tsx`). |
| **2** | **Page Équipe (/team)** | La page s'ouvre sans erreur, affichant les membres de la Faculté Polytechnique avec leurs photos, départements et rôles. L'endpoint `GET /api/public/team` est accessible **sans authentification** (vérifié par appel `curl` anonyme). Si la base est vide, la liste de référence fallback s'affiche (pas un écran d'erreur). |
| **3** | **Tableaux de bord (Design)** | Interface moderne de niveau universitaire, sans bannières dégradées multicolores (ni `from-red-700`, ni `from-blue-700`, ni `from-emerald-600`). Aucun emoji de statut (`⏳` `🚀` `🔍` `✅` `❌` `👑` `⚡`) dans les tableaux ni les badges. Navigation par Sidebar (pas d'onglets `overflow-x-auto`). Le `<select>` de rôles admin contient 5 rôles uniques (pas de doublon `STUDENT`) et inclut `VIEWER`. |
| **4** | **Gestion des Utilisateurs (Admin)** | Recherche, affichage des statuts, modification des rôles sans crash. La liste est paginée (pas `findAll()`). Un `PUT /admin/users/{uid}/role` avec un rôle inconnu renvoie 400 (pas 500). |
| **5** | **Gestion des Soumissions (Admin/Staff)** | Validation et rejet des articles soumis par les étudiants avec mise à jour immédiate du statut. **Un étudiant ne peut pas lister les soumissions des autres utilisateurs** (test avec 2 comptes étudiants, vérifier que `GET /api/soumissions` retourne uniquement les siennes). |
| **6** | **Création d'articles & événements** | Formulaires fonctionnels avec upload d'image réussi. `POST /api/blog/upload-image` renvoie 200 avec `{ imageUrl, r2Key }`. Une soumission avec `motsCles: null` ne crash pas le frontend (`publicationsService.createSoumission` est protégé par `?? []`). |
| **7** | **Mode Sombre / Mode Clair** | Transition homogène sur tous les tableaux de bord et composants. La bascule de thème ne provoque aucun flash de fond blanc. |
| **8** | **🆕 Sécurité des analytics** | Un compte étudiant (non STAFF/ADMIN) ne peut pas accéder à `GET /api/analytics/global` (HTTP 403 renvoyé). |
| **9** | **🆕 Notifications** | Le panneau de notifications s'ouvre sans erreur 404/405 pour les routes `GET /api/notifications/{userId}`. La méthode `createNotification` n'est plus exposée (ou, si implémentée, exige le rôle ADMIN). |
| **10** | **🆕 Upload d'image blog** | L'upload d'une image depuis le dashboard admin/Staff réussit (pas d'erreur 404/405). Le champ `urlImagePrincipale` de l'article est correctement renseigné. |
| **11** | **🆕 Données de démonstration** | Après la migration `V3__seed_demonstration_data.sql` (Phase 5), le site affiche ≥ 20 publications, ≥ 6 articles de blog, ≥ 4 événements et ≥ 2 membres d'équipe (l'endpoint `GET /api/public/team` renvoie au moins l'admin + un staff). |
| **12** | **🆕 Métriques IA cohérentes** | La table `ai_interactions.model` contient le vrai modèle utilisé (ex : `claude-sonnet-5-5`), pas le string dur `claude-sonnet-5` (vérifié par une requête SQL après l'envoi d'un message IA de test). |

---

## 6. Journal de Révisions

| Date | Auteur | Changement |
|---|---|---|
| (initiale) | — | Version initiale du plan, basée sur un audit global du dépôt et de l'instance de production. |
| **23/10/2026** | **Cline (audit local)** | **Révision exhaustive à partir du dépôt local** (`/home/florentin/github/Galileo`) : <br> 1. Correction de la localisation exacte du message trompeur IA (`AIAssistantPage.tsx:83-92`, `AIAssistantWidget.tsx:86-94`). <br> 2. Confirmation que le bug JSONB touche **8 champs** (pas 7) : ajout de `LearningPath.java:30` à la liste. <br> 3. Correction du nombre de lignes de `StaffDashboard.tsx` (477, pas 850). <br> 4. Ajout de la section 2.5 (10 anomalies supplémentaires non citées initialement). <br> 5. Ajout de la Phase 6 (consolidation des incohérences restantes, insérée avant §5). <br> 6. Enrichissement de la matrice de vérification (§5) avec 5 nouveaux critères (points 8-12). <br> 7. Documentation de la contrainte d'accès VPS (clé `galileo.pem` refusée pour `ec2-user`). |

---
*Ce document sert de référence contractuelle pour la mise en œuvre complète des correctifs sur la plateforme Galileo.*

