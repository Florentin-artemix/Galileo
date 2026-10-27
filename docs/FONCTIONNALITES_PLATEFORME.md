# Galileo — Documentation fonctionnelle complète

## 1. Objet et périmètre

Ce document décrit les fonctionnalités visibles dans le dépôt Galileo : interface React, API Spring Boot, services, contrôles d'accès et dépendances de configuration. Il sert de référence fonctionnelle et technique pour les utilisateurs, les responsables éditoriaux et les développeurs.

La documentation décrit le comportement prévu par le code présent dans le dépôt. Elle ne certifie ni le déploiement actuel du VPS, ni la disponibilité des clés IA, ni la configuration réelle du bucket Cloudflare R2, ni le rendu visuel sur tous les navigateurs. Les noms et règles précis doivent être relus dans le code lors d'une évolution.

Galileo est une plateforme académique destinée à la découverte, au dépôt, à la validation éditoriale, à la lecture et à l'exploitation pédagogique de publications scientifiques, mémoires, thèses et rapports.

## 2. Profils et rôles

Les rôles applicatifs sont définis dans `Role` :

| Rôle | Usage fonctionnel | Principaux accès d'interface |
|---|---|---|
| `VIEWER` | Compte de consultation de la vitrine publique. | Catalogue, notices publiques et assistant selon les contrôles métier ; les routes de dépôt, bibliothèque et dashboards ne l'incluent pas. |
| `STUDENT` | Étudiant déposant et lecteur. | Dépôt, espace étudiant, favoris, historique, bibliothèque, notifications, assistant et apprentissage. |
| `RESEARCHER` | Chercheur déposant et lecteur. | Parcours proches de `STUDENT`, avec accès au dépôt et aux outils de recherche. |
| `TEACHER` | Enseignant déposant et lecteur. | Parcours proches de `STUDENT`, avec accès au dépôt et aux outils d'apprentissage. |
| `STAFF` | Équipe éditoriale et de modération. | Gestion des soumissions, publications, contenus, statistiques et vues de gestion. |
| `ADMIN` | Administration complète. | Accès aux fonctions `STAFF`, gestion des utilisateurs, rôles, domaines, quotas et administration. |

Les routes React utilisent `RequireRole` pour masquer ou bloquer des pages. Cela améliore l'expérience utilisateur mais ne constitue pas la seule protection : les contrôleurs Spring et les services appliquent également des contrôles d'authentification, de rôle et de propriété. Les règles de service restent la source d'autorité pour les ressources.

L'inscription publique n'est pas un mécanisme d'attribution de privilèges. Le backend force ou limite les rôles enregistrables à des rôles non privilégiés. Les rôles `STAFF` et `ADMIN` doivent être attribués par les fonctions d'administration protégées.

## 3. Navigation et pages

L'application est une SPA React/TypeScript utilisant `HashRouter`. Les routes sont donc accessibles sous la forme `/#/route`.

| Route | Fonction |
|---|---|
| `/` | Page d'accueil de découverte : accès rapide aux publications, contenus mis en avant et entrées vers les parcours principaux. |
| `/about` | Présentation de Galileo et de sa mission. |
| `/team` | Présentation publique de l'équipe. |
| `/publications` | Catalogue de publications, recherche, filtres et accès aux notices. |
| `/publication/:id` | Notice détaillée et espace de lecture d'une publication. |
| `/blog` | Liste des articles éditoriaux. |
| `/blog/:id` | Lecture d'un article. |
| `/events` | Liste des événements académiques. |
| `/resources` | Ressources et catégories de ressources. |
| `/contact` | Informations et formulaire/parcours de contact. |
| `/auth` | Connexion et inscription. |
| `/submit` | Dépôt de publication, réservé aux rôles contributeurs. |
| `/dashboard/student` | Espace personnel et suivi des activités utilisateur. |
| `/dashboard/staff` | Espace de travail éditorial pour `STAFF` et `ADMIN`. |
| `/dashboard/admin` | Administration réservée à `ADMIN` et `STAFF` par le garde d'interface ; les opérations sensibles restent vérifiées côté backend. |
| `/favorites` | Liste paginée des publications enregistrées en favoris. |
| `/history` | Historique de lecture, dates, progression et durée quand ces données sont disponibles. |
| `/library` | Vue réunissant lectures récentes et favoris avec recherche et tri. |
| `/notifications` | Centre des notifications et préférences de réception. |
| `/analytics` | Tableau de bord analytique réservé à l'équipe autorisée. |
| `/ai-assistant` | Assistant conversationnel, modes général/documentaire et pièces jointes PDF selon les droits du compte. |
| `/quiz` et `/quiz/:id` | Génération, consultation et passage de quiz. |
| `/learning-paths` | Création et suivi de parcours d'apprentissage personnalisés. |

Les pages sont chargées à la demande avec `React.lazy`. Le thème clair/sombre, la langue et le contexte d'authentification sont partagés au niveau de l'application.

## 4. Découverte et catalogue scientifique

### 4.1 Catalogue

Le catalogue permet de parcourir des publications et de réduire la liste par recherche et critères disponibles dans l'interface. Il s'appuie sur le service de recherche et le service des publications. Les résultats peuvent exposer titre, auteurs, résumé, domaine, type, année, couverture et disponibilité d'un document selon les données de chaque publication.

Les fonctionnalités de recherche présentes dans l'API couvrent :

- recherche de publications avec pagination et paramètres de requête ;
- recherche avancée ;
- recherche sémantique ;
- autocomplétion et suggestions ;
- recherche de publications similaires ;
- navigation par domaine et auteur ;
- listes de publications récentes et populaires.

Les points d'entrée backend correspondants sont principalement `/api/search/**` et `/api/publications/**`. Les recherches sémantiques utilisent les embeddings configurés et `pgvector` quand le fournisseur et la base sont disponibles. Le résultat peut dépendre de l'état d'indexation du document.

### 4.2 Notice et détails

La notice de publication réunit les informations bibliographiques disponibles, par exemple titre, auteurs, résumé, mots-clés, domaine, type, date/année, couverture et informations sur le document. L'API retourne ces informations à partir des données réellement enregistrées ; les champs facultatifs peuvent être absents.

La fiche peut aussi proposer :

- accès à la lecture intégrale pour un compte autorisé ;
- téléchargement du PDF si le document existe et que le backend accepte l'accès ;
- citation bibliographique ;
- enregistrement en favori ;
- progression de lecture et historique ;
- publications similaires ;
- quiz ou assistant documentaire lorsque l'accès à la publication le permet.

Les lectures et téléchargements sont également suivis par les points d'analytics correspondants. Le suivi analytique ne doit pas être interprété comme une preuve que le fichier a été effectivement rendu dans le navigateur.

### 4.3 Niveaux d'accès des publications

Les publications portent un niveau d'accès (`PUBLIC`, `INSTITUTIONAL`, `RESTRICTED` ou `PRIVATE`) et un statut éditorial. En pratique :

- les notices publiées publiques servent la vitrine et les informations autorisées ;
- les niveaux institutionnels peuvent exiger un compte membre ;
- les publications restreintes/privées et les versions non publiées sont limitées selon les règles d'auteur et de gestion éditoriale ;
- la lecture des octets PDF, la récupération d'une URL et l'accès aux fonctions dérivées du texte doivent suivre le contrôle de lecture intégrale du backend.

Le frontend peut masquer des actions selon le rôle, mais les contrôles de sécurité doivent toujours être appliqués par l'API avant de remettre les données.

## 5. Lecture, téléchargement et documents

### 5.1 Lecteur PDF

La page de publication récupère les métadonnées du document puis demande le fichier à `/api/documents/{id}/download`. Le client HTTP Axios ajoute le jeton d'accès lorsqu'il est présent. Le frontend reçoit une réponse binaire, vérifie que les premiers octets correspondent à la signature PDF `%PDF-`, crée une URL objet `blob:` et l'affiche dans une iframe.

Le lecteur propose une barre de commandes de pagination et de zoom, des états de chargement et d'erreur, ainsi qu'une action de nouvelle tentative. Le rendu effectif dépend aussi du navigateur et de son lecteur PDF intégré. La présence d'un chargement réussi ou d'une signature PDF correcte ne suffit pas à confirmer que le navigateur a peint les pages.

### 5.2 Téléchargement

Le téléchargement passe par l'API applicative depuis le frontend, plutôt que par une navigation aveugle vers un URL de stockage. L'API de documents prévoit les opérations suivantes :

- lire les métadonnées par identifiant ;
- chercher le document associé à une publication ;
- obtenir le flux PDF ;
- obtenir une URL de téléchargement contrôlée ;
- téléverser un document pour une publication ;
- relancer le traitement asynchrone d'un document.

Les documents de publication ont une limite de taille de 50 Mo au niveau du validateur de service et une limite multipart globale déclarée à 50 Mo. Le backend valide notamment la présence du fichier, l'extension et la signature. Ces limites ne sont pas la limite des pièces jointes IA, qui constitue un parcours distinct.

### 5.3 Traitement documentaire asynchrone

Après le téléversement d'un document de publication, le backend enregistre le document et déclenche un traitement asynchrone. Le traitement extrait/indexe le contenu pour la recherche et les usages documentaires. Le document expose un statut de traitement, par exemple `UPLOADED`, `RECEIVED`, `PROCESSING`, `COMPLETED` ou `FAILED` selon le parcours. Le statut doit provenir de la réponse backend et ne doit pas être supposé terminé immédiatement après le dépôt.

Les rôles ayant le droit de modifier une publication peuvent demander une nouvelle tentative de traitement. Les échecs de stockage, d'extraction ou d'indexation doivent être observés à partir du statut et des journaux backend.

## 6. Soumission et revue éditoriale

### 6.1 Dépôt par un auteur

Les rôles `STUDENT`, `RESEARCHER`, `TEACHER`, `STAFF` et `ADMIN` ont accès à la page `/submit`. Le formulaire de dépôt envoie une soumission multipart à `/api/submissions` (alias français `/api/soumissions`). Le service backend valide les métadonnées et le PDF, crée ou associe les enregistrements nécessaires, stocke le fichier et lance le traitement documentaire applicable.

Les métadonnées de soumission comprennent les informations bibliographiques et descriptives prévues par le formulaire : titre, résumé, auteurs, domaine, type et données complémentaires. Les champs effectifs et leurs validations sont définis par les DTO et le validateur backend.

Le contributeur peut consulter ses soumissions, ouvrir une soumission, retirer ou relancer une soumission si son statut le permet. La propriété de la soumission est vérifiée côté serveur.

### 6.2 Revue par le staff

Les rôles `STAFF` et `ADMIN` peuvent parcourir les soumissions en attente, consulter les statistiques et effectuer les décisions éditoriales :

- valider/accepter une soumission ;
- rejeter une soumission avec un commentaire ;
- demander des révisions ;
- modifier le statut éditorial lorsqu'une opération correspondante est autorisée.

Les routes se trouvent sous `/api/admin/soumissions/**` et `/api/submissions/**`. Les changements sont persistés côté backend et peuvent déclencher des notifications. Les statuts visibles sont déterminés par les énumérations et DTO applicatifs : l'interface ne doit pas inventer un état de traitement.

### 6.3 Tableaux de bord éditoriaux

Le tableau de bord staff regroupe les soumissions et la gestion des publications, événements et articles de blog. Le tableau de bord administrateur ajoute les opérations d'administration du compte, les domaines et la configuration des quotas. La disponibilité exacte des commandes dépend des permissions du contrôleur backend.

## 7. Assistant IA

### 7.1 Conversation

L'assistant est accessible à un utilisateur authentifié autorisé par la route. Il propose des conversations persistantes, l'historique des conversations et des messages, la création et la suppression de conversations. Le backend conserve les messages et leurs métadonnées de génération.

Le chat accepte un mode, un message, un identifiant de conversation optionnel et éventuellement un identifiant de publication. L'accès à une conversation est limité à son propriétaire, sous réserve des règles d'administration existantes.

### 7.2 Modes et fonctions documentaires

Les fonctionnalités IA incluent :

- chat général ;
- questions sur une publication liée, alimentées par des passages indexés lorsqu'ils sont disponibles ;
- synthèse de publication ;
- explication d'un passage ;
- comparaison de publications ;
- références de source et pages lorsque l'index documentaire fournit ces métadonnées.

Les appels IA dépendent de la configuration des fournisseurs et des limites d'utilisation. Une erreur de fournisseur, une absence de clé ou une limite de quota peut rendre ces fonctions momentanément indisponibles.

### 7.3 PDF joints aux conversations

Le parcours de pièce jointe permet d'envoyer un PDF réel en multipart à `/api/ai/conversations/{id}/attachments`. La limite prévue par le service est de 20 Mo et jusqu'à cinq pièces jointes par conversation. L'upload est lié à la conversation et à son propriétaire.

Le backend vérifie le PDF et utilise PDFBox pour extraire le texte page par page. Les passages sont segmentés, avec la page et le fichier conservés comme source. La récupération des passages peut utiliser des embeddings et un repli lexical si la recherche sémantique n'est pas disponible. Le modèle reçoit les passages retenus et la question, pas simplement le nom ou l'URL du PDF.

La réponse peut inclure des références de fichiers/pages. Si aucun passage utile n'est retrouvé, le parcours prévoit une réponse d'abstention afin de ne pas compléter à partir de connaissances générales non étayées. Les PDF scannés sans texte extractible ne sont pas analysés par OCR si aucun moteur OCR n'est configuré ; ils doivent être signalés comme tels.

Une pièce jointe peut être listée et supprimée depuis la conversation. Le backend doit vérifier le propriétaire pour l'upload, la liste, la suppression et la récupération de passages.

## 8. Apprentissage et quiz

### 8.1 Quiz

Un utilisateur authentifié peut demander un quiz lié à une publication ou à un sujet selon les paramètres de l'API. Le service construit un contexte académique depuis le texte extrait d'une publication lorsqu'il est disponible, puis fait générer des questions structurées. Le nombre demandé est borné côté service (3 à 10 questions dans le parcours concerné).

Le quiz conserve les questions, options, réponse correcte et explication. L'interface permet de sélectionner des réponses, de soumettre une tentative et de consulter la correction et le score. Les résultats sont persistés pour le suivi d'apprentissage.

Un quiz associé à une publication doit respecter les droits d'accès de cette publication, car questions, réponses et explications peuvent révéler le texte intégral. La génération, la consultation, la liste par publication et la soumission d'une tentative sont des opérations distinctes à protéger.

### 8.2 Parcours d'apprentissage

Un utilisateur peut générer un parcours à partir d'un thème, consulter ses parcours, ouvrir un parcours, marquer des étapes comme terminées ou non terminées et consulter son profil d'apprentissage. La progression est associée à l'utilisateur.

### 8.3 Profil de progression

Le profil d'apprentissage regroupe les informations calculées par le service à partir des quiz et parcours. Il dépend des activités réellement enregistrées ; il ne constitue pas une évaluation externe certifiée.

## 9. Bibliothèque personnelle

### 9.1 Favoris

Un utilisateur membre peut ajouter ou retirer une publication de ses favoris, vérifier si une publication est déjà enregistrée et consulter la liste paginée. Les favoris sont rattachés au compte de l'utilisateur et non partagés globalement.

### 9.2 Historique de lecture

L'application enregistre les lectures lorsqu'un utilisateur autorisé ouvre une publication. L'historique expose les publications consultées, leur date, la progression et la durée lorsque celles-ci sont fournies par le backend. L'interface propose des pages paginées et des actions de reprise de lecture.

La progression de page et le pourcentage ne sont disponibles que si des événements de lecture pertinents ont été sauvegardés. Une donnée absente doit rester indiquée comme indisponible, pas être présentée comme zéro ou comme une lecture terminée.

### 9.3 Ma bibliothèque

La route `/library` rassemble l'historique récent et les favoris. Elle propose recherche locale dans les métadonnées disponibles, tri par date ou titre, indicateurs de nombre de documents, favoris et temps de lecture enregistré. Elle offre aussi un accès vers le dépôt de document.

Les données affichées sont effacées/changées lors du changement de compte côté frontend afin d'éviter un affichage croisé en mémoire ; le backend doit aussi cloisonner les requêtes par utilisateur.

## 10. Recommandations et abonnements

Le module de recommandations expose une liste de recommandations, le marquage comme vu, le suivi et l'arrêt du suivi d'auteurs et de sujets, ainsi que la consultation de ces abonnements. Les recommandations peuvent combiner les intérêts et interactions de l'utilisateur selon le service backend.

Les endpoints correspondants sont sous `/api/recommendations/**`, avec des alias favoris/historique historiques dans certains chemins. Les recommandations restent indicatives et leur disponibilité dépend des données de profil.

## 11. Notifications

Le centre de notifications expose :

- liste complète et liste paginée ;
- notifications non lues et compteurs/statistiques ;
- marquage d'une notification comme lue ou marquage global ;
- suppression d'une notification ;
- lecture et mise à jour des préférences par catégorie/type.

Les notifications sont généralement produites par des événements métier (par exemple revue de soumission). Les endpoints backend sont principalement organisés sous `/api/notifications/{userId}/...`. L'identifiant de compte dans l'URL ne doit pas remplacer le contrôle de propriété effectué par le contrôleur/service.

## 12. Blog, événements, ressources et équipe

### Blog

Les visiteurs peuvent lire les articles et les articles récents. `STAFF` et `ADMIN` peuvent créer, modifier, supprimer des articles et téléverser des images via les routes de gestion prévues. Les images sont stockées par le service de stockage configuré.

### Événements

Les pages événements proposent liste, détail, événements à venir/passés et recherche selon les fonctions du service frontend. `STAFF` et `ADMIN` peuvent créer, modifier et supprimer des événements par l'API de contenu. Les routes possèdent des alias français et anglais (`/api/evenements`, `/api/events`).

### Ressources

La page ressources affiche les catégories et ressources servies par `/api/content/resources`. Elle complète les contenus de publication sans se substituer à un document scientifique publié.

### Équipe

Les profils d'équipe publics sont servis par les routes `/api/public/team`. Les opérations publiques d'écriture ne doivent pas être supposées disponibles ; la gestion effective dépend des endpoints dédiés et des contrôles du backend.

## 13. Gestion des comptes et profil

Le module d'authentification permet :

- inscription ;
- connexion ;
- renouvellement du jeton ;
- déconnexion ;
- consultation du compte courant ;
- demande de réinitialisation du mot de passe.

Le frontend conserve un jeton d'accès et un jeton de renouvellement selon le service d'authentification. L'instance Axios ajoute le jeton d'accès aux requêtes API et gère le renouvellement après un `401` lorsque le flux le permet.

Le profil utilisateur permet la consultation et la mise à jour des données de profil, le téléversement d'une photo et la suppression de cette photo. Le backend rattache les modifications au compte selon les contrôles de propriété.

## 14. Administration et statistiques

### Utilisateurs et configuration

Les fonctions administrateur exposent la consultation des utilisateurs, le détail, la modification de rôle et d'état, les statistiques, les domaines et les quotas. Les changements de rôle et d'état sont restreints par le backend aux rôles d'administration correspondants.

### Statistiques

Le module analytics collecte des vues de pages, vues de publications et téléchargements. Il expose des statistiques globales, de tableau de bord, par utilisateur ou par publication selon les droits du contrôleur. Les événements analytiques mesurent des actions déclarées par le client ; ils ne valident ni la qualité d'une lecture PDF ni l'exactitude d'une réponse IA.

## 15. Principales API REST

Toutes les routes sont sous `/api` sauf indication contraire.

| Domaine | Principaux chemins |
|---|---|
| Authentification | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/forgot-password` |
| Publications | `/publications`, `/publications/{id}`, `/publications/{id}/details`, `/publications/recentes`, `/publications/populaires`, `/publications/domaine/{domaine}`, `/publications/auteur/{auteur}`, `/publications/{id}/telecharger` |
| Recherche | `/search/publications`, `/search/publications/advanced`, `/search/semantic`, `/search/publications/autocomplete`, `/search/publications/{id}/similar` |
| Documents | `/documents/{id}`, `/documents/publication/{publicationId}`, `/documents/{id}/download`, `/documents/{id}/url`, `/documents/upload`, `/documents/{id}/retry` |
| Dépôts | `/submissions` et alias `/soumissions`, avec détail, liste, suppression, nouvelle tentative et décisions éditoriales |
| IA | `/ai/chat`, `/ai/summarize`, `/ai/explain`, `/ai/compare`, `/ai/conversations/**` |
| Apprentissage | `/learning/quizzes/**`, `/learning/paths/**`, `/learning/profile` |
| Notifications | `/notifications/{userId}/...` |
| Profil et bibliothèque | `/users/me`, `/profile/photo`, `/favorites`, `/userprofile/{userId}/history` |
| Recommandations | `/recommendations/**` |
| Blog et ressources | `/blog/**`, `/content/resources` |
| Événements | `/evenements/**` et alias `/events/**` |
| Administration | `/admin/**` |
| Analytics | `/analytics/track/**`, `/analytics/global`, `/analytics/dashboard`, `/analytics/publications/{id}` |

La liste des routes ne constitue pas un contrat immuable. Pour les paramètres, formats JSON/multipart, statuts HTTP et autorisations exacts, consulter les DTO, contrôleurs et services backend correspondants.

## 16. Données principales

Les entités du domaine couvrent notamment :

- utilisateurs, rôles, profils, institutions et domaines ;
- publications, auteurs, mots-clés et niveaux d'accès ;
- documents, versions, statut de traitement, texte extrait, passages et embeddings ;
- soumissions, décisions éditoriales et commentaires ;
- conversations IA, messages, pièces jointes et passages de pièces jointes ;
- quiz, questions, tentatives, parcours, étapes, progrès et profil d'apprentissage ;
- favoris, historique de lecture, progression et recommandations ;
- notifications et préférences ;
- blog, événements et ressources ;
- événements analytics et caches de synthèses.

PostgreSQL stocke les données relationnelles. L'extension `pgvector` est utilisée pour les vecteurs de 1024 dimensions dans les parcours sémantiques configurés. Flyway gère l'évolution du schéma.

## 17. Architecture et intégrations

| Couche | Technologie et responsabilité |
|---|---|
| Interface web | React 19, TypeScript et Vite ; pages, navigation, formulaires, bibliothèque et affichage responsive. |
| Client API | Axios ; base URL configurable, JWT, traitement des réponses `401` et renouvellement du jeton. |
| Backend | Java 21, Spring Boot 3, Spring Security ; logique métier, API REST et autorisations serveur. |
| Base | PostgreSQL ; persistance relationnelle, migrations Flyway et extension pgvector pour similarité vectorielle. |
| Documents | Apache PDFBox pour l'extraction des PDF ; stockage local ou Cloudflare R2 compatible S3 selon la configuration. |
| IA | Fournisseur de génération compatible Claude et fournisseur d'embeddings selon les variables configurées. Les appels externes sont nécessaires à certaines opérations IA. |
| Livraison | Build frontend Vite et package Spring Boot ; le dépôt inclut des guides d'exploitation EC2, systemd et Nginx. |

L'application peut fonctionner avec un stockage local ou R2. La disponibilité d'une intégration ne prouve pas qu'elle est activée dans un environnement donné. Les variables et secrets de production doivent être vérifiés dans l'environnement, sans les consigner dans ce document.

## 18. Paramètres et limites fonctionnelles

- PDF de publication : validateur service jusqu'à 50 Mo ; configuration multipart backend déclarée à 50 Mo.
- PDF joint à l'assistant : limite métier de 20 Mo et jusqu'à cinq fichiers par conversation dans le service dédié.
- Extraction IA des PDF joints : maximum de 500 pages et 500 000 caractères extraits selon le service.
- Quiz : le nombre de questions est borné entre 3 et 10 dans le service de génération.
- Pagination du catalogue : taille plafonnée côté contrôleur des publications à 100 éléments par page.
- L'assistant et les embeddings sont dépendants de la configuration fournisseur, des quotas et de l'accès réseau.
- L'OCR n'est pas disponible dans le pipeline PDF joint décrit ici ; les documents sans texte sélectionnable ne peuvent pas être traités par extraction textuelle seule.
- Les URL publiques R2, les URL signées déjà distribuées et la confidentialité effective du bucket dépendent de la configuration externe.

Les limites peuvent évoluer : vérifier le code et les propriétés déployées avant de les appliquer comme engagements de service.

## 19. Sécurité et confidentialité

Les principes d'implémentation attendus sont :

1. Authentifier les fonctions personnelles et les opérations de modification.
2. Vérifier le rôle côté serveur pour les opérations éditoriales et administratives.
3. Vérifier la propriété pour les conversations, soumissions, favoris, historique, notifications et profils.
4. Distinguer l'accès aux métadonnées publiques de l'accès au document intégral.
5. Contrôler les téléchargements et les URL exploitables avant de fournir le fichier.
6. Ne pas considérer un bouton masqué dans le frontend comme une protection.
7. Ne transmettre au fournisseur IA que des passages issus de contenus auxquels l'utilisateur est autorisé à accéder.
8. Ne pas placer de secrets de fournisseur ou de base dans le frontend ou dans ce document.

Les réglages CORS, JWT, R2, HTTPS, pare-feu et permissions de fichiers doivent être adaptés à l'environnement de déploiement. Le code seul ne confirme pas leur état effectif en production.

## 20. Démarrage et commandes de développement

Prérequis indiqués par le projet : Node.js/npm, Java 21, PostgreSQL avec `pgvector` pour les fonctions vectorielles. Les dépendances externes IA et R2 nécessitent leurs propres secrets lorsque ces fonctions sont activées.

Frontend :

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Backend :

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

Le client utilise `/api` par défaut, configurable avec `VITE_API_URL`. Les paramètres backend se trouvent dans `backend/src/main/resources/application.yml` et peuvent être remplacés par variables d'environnement. Consulter `README.md` et `DEPLOYMENT_EC2.md` pour la procédure de déploiement ; ces documents doivent être confrontés à l'infrastructure réelle avant toute opération.

## 21. Glossaire

| Terme | Définition |
|---|---|
| Publication | Notice bibliographique et contenu scientifique géré dans le catalogue. |
| Soumission | Dépôt candidat soumis au processus éditorial avant sa publication. |
| Lecture intégrale | Accès au contenu complet du PDF, distinct de la consultation de métadonnées. |
| Document processing | Extraction, découpage et indexation asynchrones du PDF de publication. |
| RAG | Recherche de passages documentaires pertinents, transmis ensuite au modèle IA comme contexte. |
| Embedding | Représentation numérique d'un passage, utilisée par la recherche sémantique. |
| Abstention | Réponse indiquant que les sources disponibles ne permettent pas de répondre de façon vérifiable. |
| Parcours | Suite d'étapes d'apprentissage enregistrée et suivie pour un utilisateur. |
| Progression de lecture | Position ou avancement sauvegardé pour un utilisateur dans une publication. |

## 22. Sources de référence dans le dépôt

- Navigation et rôles des pages : `src/App.tsx`, `src/components/RequireRole.tsx`, `src/constants/roles.ts`.
- Client API et identité : `src/services/apiService.ts`, `src/services/authService.ts`, `src/contexts/AuthContext.tsx`.
- Services frontend : `src/services/`.
- Contrôleurs backend : `backend/src/main/java/com/galileo/**/controller/`.
- Logique métier : `backend/src/main/java/com/galileo/**/service/`.
- Modèle relationnel : `backend/src/main/java/com/galileo/**/entity/`.
- Migrations et configuration : `backend/src/main/resources/db/migration/`, `backend/src/main/resources/application.yml`.
- Présentation générale et exploitation : `README.md`, `DEPLOYMENT_EC2.md`.
