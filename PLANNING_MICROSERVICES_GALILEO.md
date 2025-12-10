# ARCHITECTURE MICROSERVICES & PLANNING JOURNALIER - GALILEO

## 1. ARCHITECTURE MICROSERVICES (SPRING CLOUD)

Pour répondre à votre exigence de scalabilité maximale et de découplage, nous passons d'une architecture modulaire à une architecture **Microservices Distribuée**.

### Les Composants du Système
L'application sera découpée en services indépendants, déployables séparément.

1.  **Portail (API Gateway)**
    *   **Techno :** Spring Cloud Gateway.
    *   **Rôle :** Point d'entrée unique. Gère le routage (`/api/publications` -> Service Lecture, `/api/soumissions` -> Service Écriture), le Rate Limiting et la vérification initiale du Token Firebase.

2.  **Service-Lecture (Consultation)**
    *   **Rôle :** Gère tout ce qui est public et très sollicité (Publications, Blog, Événements).
    *   **Base de Données :** `db_galileo_lecture` (PostgreSQL).
    *   **Optimisation :** Ce service peut être répliqué en plusieurs instances pour encaisser la charge.

3.  **Service-Ecriture (Workflow & Administration)**
    *   **Rôle :** Gère le processus métier complexe (Soumissions, Validation, Changement d'états).
    *   **Base de Données :** `db_galileo_ecriture` (PostgreSQL).
    *   **Communication :** Envoie des événements au Service-Lecture via Kafka ou RabbitMQ (ou REST synchrone pour commencer) quand une publication est validée.

4.  **Service-Notification**
    *   **Rôle :** Microservice dédié à l'envoi d'emails (SendGrid/SMTP). Écoute les événements des autres services.

5.  **ServiceRecherche (Recherche)**
    *   **Rôle :** Gère l'indexation et la recherche des publications et blogs.
    *   **Technologie :** Elasticsearch.
    *   **Base de Données :** `db_galileo_lecture` (PostgreSQL) pour les métadonnées, Elasticsearch pour le contenu.

6.  **ServiceStockage (Stockage)**
    *   **Rôle :** Gère le stockage et la récupération des fichiers (PDF, images).
    *   **Technologie :** AWS S3 pour le stockage, GitHub comme CDN.
    *   **Base de Données :** `db_galileo_ecriture` (PostgreSQL) pour les métadonnées, S3 et GitHub pour le contenu.

### Stack Technique
*   **Langage :** Java 21 (Spring Boot 3.2).
*   **Orchestration :** Docker Compose (Dev) / Kubernetes (Prod).
*   **Communication :** REST (Synchrone) + Feign Client.
*   **Auth :** Firebase Auth (validé au niveau Gateway ou Service).

---

## 2. PLANNING JOURNALIER (20 JOURS)

Ce planning est plus dense car une architecture microservices demande plus de configuration (Gateway, Réseau, Sécurité inter-services).

### PHASE 1 : INFRASTRUCTURE & GATEWAY (Jours 1-3)

*   **JOUR 1 : Initialisation de l'Écosystème**
    *   [ ] Créer le repo Git unique (Monorepo) ou multi-repos.
    *   [ ] Initialiser 3 projets Spring Boot : `galileo-gateway`, `galileo-lecture`, `galileo-ecriture`.
    *   [ ] Configurer `docker-compose.yml` pour lancer 2 bases PostgreSQL (`db_lecture`, `db_ecriture`).

*   **JOUR 2 : Configuration de la Gateway (Portail)**
    *   [ ] Implémenter `Spring Cloud Gateway`.
    *   [ ] Configurer les routes statiques dans `application.yml`.
    *   [ ] Implémenter le `FiltreAuthentificationFirebase` au niveau de la Gateway pour rejeter les requêtes non authentifiées vers les routes protégées.

*   **JOUR 3 : Sécurité & Communication**
    *   [ ] Configurer CORS globalement sur la Gateway.
    *   [ ] Mettre en place `OpenFeign` pour permettre aux services de se parler si besoin.

### PHASE 2 : SERVICE LECTURE (PUBLIC) (Jours 4-8)

*   **JOUR 4 : Domaine Publications (Lecture)**
    *   [ ] Créer entité `Publication` dans `galileo-lecture`.
    *   [ ] Implémenter `ControleurPublicationPublic` (GET list, GET detail).
    *   [ ] Connecter à `db_galileo_lecture`.

*   **JOUR 5 : Recherche & Filtrage**
    *   [ ] Implémenter la recherche par critères (Domaine, Auteur) avec `Specification` JPA.
    *   [ ] Optimiser les requêtes SQL (Indexation).

*   **JOUR 6 : Blog & Événements**
    *   [ ] Implémenter entités `ArticleBlog` et `Evenement`.
    *   [ ] Créer les endpoints de lecture correspondants.

*   **JOUR 7 : Gestion des Fichiers (Lecture)**
    *   [ ] Implémenter le service de génération d'URL signées (S3) pour le téléchargement sécurisé des PDFs.

*   **JOUR 8 : Tests Service Lecture**
    *   [ ] Tests d'intégration API pour le service lecture.

### PHASE 3 : SERVICE ÉCRITURE (WORKFLOW) (Jours 9-14)

*   **JOUR 9 : Modélisation Soumissions**
    *   [ ] Créer entité `Soumission` dans `galileo-ecriture`.
    *   [ ] Connecter à `db_galileo_ecriture`.

*   **JOUR 10 : Workflow Étudiant**
    *   [ ] Endpoint `POST /soumissions` : Upload fichier S3 + Création enregistrement DB.
    *   [ ] Validation stricte des métadonnées.

*   **JOUR 11 : Workflow Admin (Validation)**
    *   [ ] Endpoints Admin : `listerSoumissionsEnAttente`, `validerSoumission`, `rejeterSoumission`.
    *   [ ] Logique métier : Quand `validerSoumission` est appelé -> Créer un objet `Publication` et l'envoyer au Service-Lecture.

*   **JOUR 12 : Synchronisation Inter-Services**
    *   [ ] Implémenter l'appel REST (via Feign) : `Service-Ecriture` appelle `Service-Lecture` pour créer la publication officielle une fois validée.
    *   [ ] Gestion des transactions distribuées (Pattern SAGA simplifié : si création échoue, rollback validation).

*   **JOUR 13 : Service Notification**
    *   [ ] Créer un petit service ou module pour l'envoi d'emails.
    *   [ ] Déclencher email quand statut soumission change.

*   **JOUR 14 : Tests Service Écriture**
    *   [ ] Tests des scénarios complexes (Soumission -> Validation -> Publication).

### PHASE 4 : INTÉGRATION & DÉPLOIEMENT (Jours 15-18)

*   **JOUR 15 : Intégration Frontend**
    *   [ ] Connecter le React App à la Gateway (Port 8080).
    *   [ ] Vérifier que le token Firebase passe bien à travers la Gateway jusqu'aux services.

*   **JOUR 16 : Monitoring & Logs**
    *   [ ] Ajouter `Spring Actuator` pour le health check.
    *   [ ] Centraliser les logs (Docker logs pour commencer).

*   **JOUR 17 : Conteneurisation Finale**
    *   [ ] Optimiser les Dockerfiles (Multi-stage build).
    *   [ ] Vérifier le redémarrage automatique des services.

*   **JOUR 18 : Recette Finale**
    *   [ ] Test de charge complet.
    *   [ ] Documentation des APIs (Swagger Aggregator sur la Gateway).

### PHASE 5 : INTÉGRATION ELASTICSEARCH & CDN (Jours 19-20)

*   **JOUR 19 : Intégration Elasticsearch**
    *   [ ] Ajouter Elasticsearch comme moteur de recherche pour les publications et les blogs.
    *   [ ] Configurer un cluster Elasticsearch local pour le développement.
    *   [ ] Implémenter un service `ServiceRecherche` dans `galileo-lecture` pour indexer les données des publications et des blogs.
    *   [ ] Ajouter des endpoints pour la recherche avancée (par mots-clés, domaine, auteur).

*   **JOUR 20 : Intégration du CDN GitHub**
    *   [ ] Configurer un dépôt GitHub pour héberger les fichiers PDF et les images.
    *   [ ] Automatiser l'upload des fichiers vers le dépôt via l'API GitHub.
    *   [ ] Générer des liens publics pour les fichiers hébergés et les renvoyer au backend.
    *   [ ] Mettre à jour les services `ServiceStockage` et `ServiceEcriture` pour utiliser ces liens dans la base de données.

---

## 3. AVANTAGES DE CETTE APPROCHE
1.  **Scalabilité Indépendante :** Si le blog a beaucoup de trafic, on peut lancer 3 instances du `Service-Lecture` sans toucher au `Service-Ecriture`.
2.  **Robustesse :** Si le module de soumission plante, le site reste accessible pour les lecteurs.
3.  **Sécurité :** La base de données des soumissions (données sensibles) est physiquement séparée de la base publique.
