# CAHIER DES CHARGES
## GALILEO — Intelligent Academic & Research Platform

**Version :** 3.0  
**Type :** Plateforme web intelligente de publication, d'apprentissage, de découverte et de recherche académique  
**Public cible :** Étudiants, chercheurs, enseignants, institutions académiques et lecteurs intéressés par les connaissances scientifiques  
**Backend cible :** Spring Boot / Java  
**Frontend cible :** React / TypeScript  
**Base de données :** PostgreSQL  
**Stockage documentaire :** Cloudflare R2 ou service S3 compatible  
**IA principale :** DeepSeek API  
**Déploiement cible :** Heroku ou autre PaaS équivalent  
**Docker :** Non requis pour le déploiement

---

# 1. PRÉSENTATION DU PROJET

## 1.1. Contexte

Les universités et communautés scientifiques produisent continuellement :

- mémoires ;
- travaux de fin d'études ;
- travaux pratiques ;
- articles scientifiques ;
- rapports ;
- projets académiques ;
- recherches ;
- documents pédagogiques.

Cependant, ces productions restent souvent dispersées, difficiles à découvrir et insuffisamment exploitées par les étudiants et les chercheurs.

Un étudiant peut réaliser un excellent mémoire qui reste inconnu des autres étudiants.

Un chercheur peut rechercher un sujet précis sans disposer d'une vision claire des travaux déjà réalisés dans son environnement académique.

De même, un étudiant souhaitant approfondir un sujet doit souvent parcourir de nombreuses sources sans savoir lesquelles sont réellement pertinentes.

Galileo vise à résoudre ce problème en créant un espace numérique dans lequel les productions académiques peuvent être :

**publiées, découvertes, consultées, comprises, reliées et exploitées pour poursuivre l'apprentissage ou la recherche.**

---

# 2. VISION

## 2.1. Vision générale

> **Galileo est une plateforme intelligente où les étudiants et les chercheurs publient leurs travaux, découvrent ceux des autres, développent leurs connaissances et utilisent l'intelligence artificielle pour mieux comprendre et explorer la littérature académique.**

Galileo doit créer une boucle de connaissance :

```text
             ┌─────────────────────┐
             │       PRODUIRE      │
             │ Mémoire / Article / │
             │ Travail académique  │
             └──────────┬──────────┘
                        ↓
                 ┌─────────────┐
                 │   PUBLIER   │
                 └──────┬──────┘
                        ↓
              ┌───────────────────┐
              │     DÉCOUVRIR     │
              │ Recherche / IA /  │
              │ Recommandations   │
              └─────────┬─────────┘
                        ↓
                 ┌────────────┐
                 │    LIRE    │
                 └─────┬──────┘
                       ↓
               ┌───────────────┐
               │   COMPRENDRE  │
               │     IA / RAG  │
               └───────┬───────┘
                       ↓
                ┌─────────────┐
                │ S'INSPIRER  │
                │             │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │ APPRENDRE   │
                │ / CHERCHER  │
                └──────┬──────┘
                       ↓
                 NOUVEAU TRAVAIL
                       │
                       └──────→ PUBLIER
```

---

# 3. POSITIONNEMENT

Galileo doit réunir trois dimensions complémentaires.

## 3.1. Academic Repository

Une plateforme où les utilisateurs peuvent publier :

- mémoires ;
- travaux de fin d'études ;
- travaux pratiques ;
- articles ;
- rapports ;
- projets ;
- autres productions académiques autorisées.

## 3.2. Learning Platform

Un environnement permettant à un étudiant de :

- découvrir un sujet ;
- trouver des travaux ;
- comprendre des documents ;
- approfondir ses connaissances ;
- suivre son apprentissage ;
- générer des exercices ;
- utiliser l'IA comme assistant.

## 3.3. Research Platform

Un environnement permettant au chercheur de :

- rechercher un sujet précis ;
- découvrir des travaux existants ;
- comparer les approches ;
- identifier les travaux proches ;
- organiser sa veille ;
- publier ses propres recherches.

---

# 4. PROBLÈME PRINCIPAL

Galileo cherche à résoudre le problème suivant :

> **Comment permettre à une communauté académique de transformer ses productions dispersées en une base de connaissances vivante, accessible et exploitable intelligemment ?**

Le problème possède plusieurs dimensions.

### Pour l'étudiant

Il doit pouvoir :

```text
Chercher un sujet
        ↓
Trouver des travaux
        ↓
Comprendre les travaux
        ↓
Apprendre
        ↓
Développer sa propre réflexion
        ↓
Produire son propre travail
        ↓
Publier
```

### Pour le chercheur

```text
Question de recherche
        ↓
Recherche
        ↓
Travaux existants
        ↓
Analyse
        ↓
Comparaison
        ↓
Nouvelles pistes
        ↓
Recherche
        ↓
Publication
```

---

# 5. OBJECTIFS

## 5.1. Objectif général

Développer une plateforme web intelligente permettant aux étudiants et chercheurs de **publier, rechercher, découvrir, comprendre et exploiter des travaux académiques et scientifiques**.

## 5.2. Objectifs spécifiques

Galileo devra permettre de :

1. créer un compte académique ;
2. créer et gérer un profil ;
3. publier des travaux ;
4. déposer des mémoires ;
5. déposer des articles scientifiques ;
6. déposer des travaux académiques ;
7. rechercher les productions publiées ;
8. découvrir les travaux d'autres personnes ;
9. rechercher par sujet ;
10. rechercher par auteur ;
11. rechercher par domaine ;
12. effectuer une recherche sémantique ;
13. lire les documents ;
14. sauvegarder les documents ;
15. conserver l'historique de lecture ;
16. obtenir des recommandations ;
17. demander des explications à l'IA ;
18. résumer les documents ;
19. poser des questions sur les documents ;
20. comparer plusieurs travaux ;
21. générer des supports d'apprentissage ;
22. construire un parcours d'apprentissage ;
23. préparer une recherche ;
24. suivre certaines thématiques ;
25. publier ses propres résultats ;
26. gérer la validation éditoriale ;
27. fournir des statistiques sur les publications.

---

# 6. UTILISATEURS

## 6.1. VISITEUR

Un visiteur peut :

- consulter Galileo ;
- rechercher des travaux publics ;
- consulter les auteurs ;
- lire les informations publiques ;
- découvrir les domaines ;
- consulter les événements et contenus publics.

---

# 6.2. ÉTUDIANT

L'étudiant constitue l'un des utilisateurs principaux.

Il peut :

- consulter les travaux ;
- rechercher un sujet ;
- publier ses travaux ;
- publier son mémoire ;
- consulter les mémoires d'autres étudiants ;
- enregistrer ses documents favoris ;
- suivre sa progression ;
- demander des explications à l'IA ;
- générer des questions ;
- préparer un exposé ;
- préparer un mémoire ;
- découvrir des travaux liés à son domaine.

---

# 6.3. CHERCHEUR

Le chercheur peut :

- rechercher des travaux sur un sujet ;
- consulter les publications ;
- comparer plusieurs travaux ;
- publier ses propres résultats ;
- construire une veille ;
- suivre des sujets ;
- suivre des auteurs ;
- obtenir des recommandations ;
- exploiter les capacités d'analyse de Galileo.

---

# 6.4. ENSEIGNANT

L'enseignant pourra :

- consulter les productions étudiantes ;
- partager des ressources ;
- suivre des domaines ;
- recommander certains travaux ;
- éventuellement superviser les publications étudiantes selon les politiques de l'institution.

---

# 6.5. STAFF

Le staff gère :

- validation ;
- modération ;
- publication ;
- événements ;
- contenus éditoriaux.

---

# 6.6. ADMINISTRATEUR

L'administrateur gère :

- utilisateurs ;
- rôles ;
- domaines ;
- publications ;
- paramètres ;
- statistiques ;
- configuration des services ;
- quotas IA.

---

# 7. TYPES DE CONTENUS PUBLIABLES

Galileo devra prendre en charge plusieurs types de productions.

## 7.1. Production étudiante

- mémoire ;
- travail de fin d'études ;
- rapport académique ;
- travail pratique ;
- projet ;
- étude ;
- article étudiant.

## 7.2. Production scientifique

- article scientifique ;
- communication ;
- rapport de recherche ;
- note scientifique ;
- étude expérimentale.

## 7.3. Contenu académique complémentaire

- ressources pédagogiques ;
- notes ;
- documents explicatifs ;
- contenus éditoriaux.

---

# 8. MÉTADONNÉES D'UN TRAVAIL

Chaque travail doit au minimum contenir :

```text
Titre
Type
Auteur(s)
Résumé
Domaine
Sous-domaine
Mots-clés
Institution
Programme / laboratoire
Date
Langue
Document
Statut
```

Des métadonnées complémentaires pourront être ajoutées :

```text
Directeur
Encadreur
Année académique
Méthodologie
DOI / identifiant
Références
Licence
```

---

# 9. PUBLICATION D'UN TRAVAIL

Le processus de publication sera :

```text
BROUILLON
   ↓
SOUMISSION
   ↓
ANALYSE AUTOMATIQUE
   ↓
VALIDATION
   ↓
PUBLICATION
   ↓
INDEXATION
```

ou :

```text
SOUMISSION
   ↓
REJET
```

L'IA peut assister l'analyse mais ne doit pas décider seule de la publication.

---

# 10. PROPRIÉTÉ DU CONTENU

Lorsqu'un étudiant ou un chercheur publie un travail, Galileo doit conserver l'auteur et les métadonnées de propriété.

Le système devra permettre de définir :

- public ;
- privé ;
- accès institutionnel ;
- accès restreint.

L'utilisateur doit choisir les conditions de diffusion autorisées par l'institution et les règles applicables.

---

# 11. RECHERCHE

La recherche constitue l'une des fonctions principales de Galileo.

## 11.1. Recherche classique

Recherche par :

- titre ;
- auteur ;
- domaine ;
- mots-clés ;
- type de document ;
- institution ;
- année.

## 11.2. Recherche avancée

Filtres combinables :

```text
Domaine
Type
Année
Auteur
Institution
Langue
```

## 11.3. Recherche sémantique

L'utilisateur pourra rechercher en langage naturel.

Exemple :

> « Je cherche des mémoires portant sur l'utilisation de l'intelligence artificielle pour détecter les maladies des plantes. »

Galileo doit retourner des travaux pertinents même lorsque les termes exacts diffèrent.

---

# 12. DÉCOUVERTE DES TRAVAUX D'AUTRES UTILISATEURS

Un utilisateur doit pouvoir explorer les productions de la communauté.

Exemples :

```text
Travaux similaires
Travaux récents
Travaux populaires
Travaux d'un auteur
Travaux d'une institution
Travaux d'un domaine
Travaux recommandés
```

Un étudiant pourra ainsi découvrir :

> « D'autres étudiants ont déjà travaillé sur ce sujet. »

Un chercheur pourra découvrir :

> « Voici les travaux proches de mon sujet. »

---

# 13. RECOMMANDATION

Galileo doit progressivement proposer des recommandations basées sur :

- recherches ;
- historique ;
- favoris ;
- domaines ;
- niveau ;
- publications consultées ;
- sujets suivis.

Exemple :

```text
Vous avez consulté plusieurs travaux sur
"Machine Learning"

        ↓

Galileo recommande :

- nouvelles publications
- mémoires
- articles
- ressources
- sujets connexes
```

---

# 14. LECTURE

La plateforme doit proposer une expérience de lecture adaptée aux documents académiques.

Fonctions :

- visualisation PDF ;
- pagination ;
- progression ;
- favoris ;
- historique ;
- téléchargement selon autorisation.

---

# 15. INTELLIGENCE ARTIFICIELLE

L'IA constitue un composant central du produit.

L'objectif n'est pas d'ajouter un chatbot générique.

L'IA doit être intégrée directement dans :

```text
Recherche
Lecture
Apprentissage
Analyse
Découverte
Publication
```

---

# 16. DEEPSEEK

Le moteur LLM principal du système sera **DeepSeek via API**.

Le frontend ne devra jamais exposer la clé API.

Architecture :

```text
React
   ↓
Spring Boot
   ↓
AI Service
   ↓
DeepSeek Provider
   ↓
DeepSeek API
```

Une abstraction `AIProvider` doit être utilisée afin de permettre ultérieurement l'ajout d'autres modèles.

---

# 17. ASSISTANT GALILEO

L'assistant doit posséder plusieurs modes.

## 17.1. Mode général

Pour aider l'étudiant à comprendre un sujet.

Exemple :

> « Explique-moi les bases du machine learning. »

## 17.2. Mode document

Pour discuter d'un travail précis.

Exemple :

> « Quel est l'objectif de cette étude ? »

## 17.3. Mode recherche

Pour explorer plusieurs travaux.

Exemple :

> « Quelles méthodes sont utilisées dans les travaux disponibles sur ce sujet ? »

## 17.4. Mode apprentissage

Pour enseigner progressivement.

Exemple :

> « Explique cette notion comme si je débutais. »

---

# 18. RAG

Les fonctions documentaires devront utiliser une architecture RAG.

```text
PDF
 ↓
Extraction
 ↓
Nettoyage
 ↓
Découpage
 ↓
Embeddings
 ↓
Base vectorielle
 ↓
Recherche
 ↓
Contexte
 ↓
DeepSeek
 ↓
Réponse
```

Cela permet à Galileo de répondre à partir des documents disponibles plutôt que de demander au modèle de mémoriser toute la littérature.

---

# 19. QUESTIONS SUR UN TRAVAIL

Un utilisateur doit pouvoir demander :

- Quel est le problème étudié ?
- Quels sont les objectifs ?
- Quelle méthodologie est utilisée ?
- Quels résultats sont obtenus ?
- Quelles sont les limites ?
- Que disent les auteurs sur X ?
- Quelle technologie est utilisée ?
- Quels jeux de données sont utilisés ?
- Explique cette section.

Les réponses doivent renvoyer vers le document utilisé lorsque cela est possible.

---

# 20. RÉSUMÉ INTELLIGENT

Trois formats principaux :

### Résumé rapide

Comprendre le document en quelques instants.

### Résumé structuré

```text
Problématique
Objectifs
Méthode
Résultats
Limites
Conclusion
```

### Résumé pédagogique

Explication adaptée au niveau de l'utilisateur.

---

# 21. COMPARAISON DE TRAVAUX

L'utilisateur peut sélectionner plusieurs travaux.

Exemple :

```text
Mémoire A
Mémoire B
Article C
```

Galileo produit :

```text
Sujet
Objectifs
Méthodologie
Technologies
Données
Résultats
Limites
```

avec une comparaison structurée.

---

# 22. INSPIRATION ET EXPLORATION

Une fonction essentielle de Galileo consiste à permettre à l'utilisateur de **s'inspirer des travaux existants sans les reproduire**.

Lorsqu'un étudiant consulte un travail, Galileo peut proposer :

```text
Travaux proches
Travaux qui utilisent une autre méthode
Travaux portant sur le même problème
Travaux dans un autre contexte
Travaux complémentaires
```

L'objectif est de faire émerger :

```text
Travail existant
      ↓
Compréhension
      ↓
Comparaison
      ↓
Question nouvelle
      ↓
Nouvelle contribution
```

Galileo ne doit pas encourager le plagiat.

---

# 23. ASSISTANCE À LA RECHERCHE

Pour un étudiant ou chercheur, Galileo pourra fournir un espace de recherche.

L'utilisateur peut saisir :

```text
Sujet :
Détection automatique du paludisme
par intelligence artificielle
```

Le système peut proposer :

```text
Concepts
Publications
Méthodes
Technologies
Auteurs
Travaux similaires
Questions ouvertes
```

Cette fonction évoluera progressivement.

---

# 24. APPRENTISSAGE POUR LES ÉTUDIANTS

Galileo doit considérer l'étudiant comme un **apprenant actif**, pas seulement comme un lecteur de PDF.

Le système doit pouvoir transformer les publications en ressources d'apprentissage.

---

# 25. EXPLICATION PÉDAGOGIQUE

L'étudiant peut demander :

> « Explique-moi ce passage simplement. »

Galileo peut fournir :

```text
Explication simple
        ↓
Exemple
        ↓
Notion associée
        ↓
Question de vérification
```

Le niveau peut être adapté à son profil.

---

# 26. QUIZ ET EXERCICES

À partir d'un document ou d'un sujet :

```text
PDF
 ↓
DeepSeek
 ↓
Questions
 ↓
Réponses
 ↓
Correction
 ↓
Explication
```

Formats :

- QCM ;
- questions ouvertes ;
- vrai/faux ;
- exercices ;
- flashcards.

---

# 27. PARCOURS D'APPRENTISSAGE

Un étudiant peut demander :

> « Je veux apprendre la cybersécurité. »

Galileo peut proposer :

```text
Fondamentaux
   ↓
Réseaux
   ↓
Systèmes
   ↓
Sécurité
   ↓
Cryptographie
   ↓
Sécurité applicative
   ↓
Projet
```

Le parcours doit pouvoir référencer les travaux et ressources disponibles sur Galileo.

---

# 28. PROFIL D'APPRENTISSAGE

Le système peut progressivement mémoriser :

```text
Sujets étudiés
Progression
Documents consultés
Quiz
Résultats
Niveau estimé
Centres d'intérêt
```

Ces données permettront de personnaliser les recommandations.

---

# 29. PROGRESSION VERS LA RECHERCHE

L'étudiant doit pouvoir évoluer progressivement :

```text
Apprendre
   ↓
Comprendre
   ↓
Explorer
   ↓
Lire des travaux
   ↓
Comparer
   ↓
Formuler une idée
   ↓
Réaliser un travail
   ↓
Publier
```

C'est une dimension centrale de Galileo.

---

# 30. PUBLICATION DU MÉMOIRE

Un étudiant doit pouvoir publier son mémoire directement depuis son espace.

Processus :

```text
Mes travaux
      ↓
Nouveau travail
      ↓
Type = Mémoire
      ↓
Upload PDF
      ↓
Métadonnées
      ↓
Analyse IA
      ↓
Vérification
      ↓
Soumission
      ↓
Validation
      ↓
Publication
```

---

# 31. PUBLICATION D'UN ARTICLE OU TRAVAIL DE RECHERCHE

Le chercheur suit un workflow similaire :

```text
Nouvelle publication
      ↓
Type = Article
      ↓
Document
      ↓
Métadonnées
      ↓
Soumission
      ↓
Validation
      ↓
Publication
```

---

# 32. PROFIL D'AUTEUR

Chaque auteur pourra disposer d'une page publique contenant :

```text
Nom
Institution
Domaine
Biographie
Publications
Travaux
Centres d'intérêt
```

Un visiteur pourra explorer la production d'un auteur.

---

# 33. PAGE D'UN TRAVAIL

Chaque travail publié doit afficher :

```text
Titre
Auteur(s)
Type
Résumé
Métadonnées
Date
Institution
Mots-clés

[Lire]
[Ajouter aux favoris]
[Demander à Galileo]
[Travaux similaires]
```

---

# 34. FAVORIS ET HISTORIQUE

Le système actuel de favoris et d'historique doit être conservé.

L'utilisateur pourra :

- ajouter un travail aux favoris ;
- consulter ses favoris ;
- retrouver ses dernières lectures ;
- reprendre une lecture ;
- retrouver des travaux précédemment consultés.

---

# 35. NOTIFICATIONS

Notifications concernant :

- soumission ;
- validation ;
- publication ;
- commentaire ;
- événement ;
- recommandations ;
- traitement IA ;
- mise à jour d'une publication suivie.

---

# 36. VEILLE

Une fonction de veille permettra à l'utilisateur de suivre :

- un sujet ;
- un domaine ;
- un auteur ;
- éventuellement une institution.

Lorsqu'un nouveau travail pertinent apparaît :

```text
Nouveau travail correspondant à votre sujet :
"Intelligence artificielle en agriculture"
```

une notification peut être générée.

---

# 37. ANALYTICS

Galileo devra mesurer :

- vues ;
- téléchargements ;
- publications ;
- recherches ;
- consultations ;
- interactions IA ;
- domaines populaires.

Pour un auteur :

```text
Nombre de vues
Téléchargements
Publications
```

Pour l'administration :

```text
Utilisateurs
Travaux
Domaines
Activité
Utilisation IA
```

---

# 38. ARCHITECTURE TECHNIQUE

Le projet actuel comporte plusieurs applications Spring Boot distinctes.

Pour la nouvelle version :

> **Galileo sera restructuré en monolithe modulaire Spring Boot.**

Architecture logique :

```text
galileo-backend
│
├── auth
├── users
├── publications
├── submissions
├── documents
├── search
├── learning
├── ai
├── recommendations
├── notifications
├── analytics
└── admin
```

Cette organisation conserve la séparation métier sans imposer plusieurs applications à déployer.

---

# 39. TECHNOLOGIES

## Frontend

```text
React
TypeScript
Vite
React Router
Axios
```

Le frontend actuel constitue la base à conserver et à refactorer progressivement.

## Backend

```text
Java 21
Spring Boot
Spring Security
Spring Data JPA
Validation
Actuator
```

## Base de données

```text
PostgreSQL
```

## Recherche sémantique

```text
pgvector
```

## Recherche full-text

La possibilité de conserver Elasticsearch présente dans le projet actuel sera évaluée avant suppression.

## Stockage

```text
Cloudflare R2
```

## IA

```text
DeepSeek API
```

## Déploiement

```text
Heroku
```

ou PaaS équivalent.

---

# 40. ABSENCE DE DOCKER EN PRODUCTION

Docker ne doit pas être une dépendance du déploiement.

Le backend doit pouvoir être construit avec :

```bash
mvn clean package
```

puis lancé avec :

```bash
java -jar target/galileo.jar
```

Le frontend doit pouvoir être construit avec :

```bash
npm install
npm run build
```

et servir les fichiers de production.

---

# 41. ARCHITECTURE DE DÉPLOIEMENT

```text
                     INTERNET
                         │
                         ▼
                  Frontend React
                         │
                         ▼
                  Spring Boot API
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
   PostgreSQL        Cloudflare R2     DeepSeek API
   + pgvector
```

Aucun serveur GPU n'est nécessaire.

Aucun VPS n'est nécessaire pour le MVP.

Aucun Docker n'est nécessaire en production.

---

# 42. ARCHITECTURE IA

```text
                       Galileo
                           │
                       AI Service
                           │
                      AI Provider
                           │
                    DeepSeek Provider
                           │
                     DeepSeek API
```

Le code doit dépendre de l'abstraction :

```text
AIProvider
```

et non directement de DeepSeek.

---

# 43. DOCUMENT INTELLIGENCE PIPELINE

```text
        PDF
         │
         ▼
Extraction du texte
         │
         ▼
Nettoyage
         │
         ▼
Segmentation
         │
         ▼
Métadonnées
         │
         ▼
Embeddings
         │
         ▼
PostgreSQL + pgvector
         │
         ├──────────────┐
         ▼              ▼
Recherche         Question/Réponse
sémantique              │
         │              ▼
         └──────────► DeepSeek
                         │
                         ▼
                      Réponse
```

---

# 44. MODÈLE DE DONNÉES PRINCIPAL

Tables principales :

```text
users
roles
profiles
institutions

publications
publication_authors
publication_types
domains
categories
keywords
publication_keywords

submissions
documents
document_chunks
document_embeddings

favorites
reading_history

search_history
recommendations
followed_topics
followed_authors

learning_profiles
learning_paths
learning_progress
quiz
quiz_questions
quiz_attempts

ai_conversations
ai_messages
ai_interactions

notifications

events
blog_posts

analytics_events
```

---

# 45. RÈGLE FONDAMENTALE SUR L'IA

L'IA doit intervenir lorsqu'elle crée une valeur réelle.

### Sans IA

```text
Afficher PDF
Rechercher titre
Filtrer
Paginer
Télécharger
```

### Avec IA

```text
Comprendre
Résumer
Expliquer
Comparer
Recommander
Relier
Explorer
Adapter l'apprentissage
```

---

# 46. INTÉGRITÉ ACADÉMIQUE

Galileo doit favoriser l'inspiration scientifique sans devenir un outil de plagiat.

Le système doit distinguer :

```text
Comprendre un travail
        ≠
Copier un travail
```

L'IA ne doit pas être conçue pour reproduire intégralement un mémoire existant.

Les fonctionnalités d'assistance à la recherche devront encourager :

- citation des sources ;
- attribution des auteurs ;
- vérification des informations ;
- formulation originale ;
- contribution personnelle.

Une fonctionnalité ultérieure pourra détecter les similarités textuelles excessives.

---

# 47. CONFIDENTIALITÉ

Un document non publié ne doit jamais être exposé à un autre utilisateur via :

- recherche ;
- recommandation ;
- RAG ;
- assistant IA.

Avant toute récupération documentaire par l'IA :

```text
Utilisateur
      ↓
Autorisation
      ↓
Documents accessibles
      ↓
RAG
```

---

# 48. GESTION DES COÛTS IA

Galileo doit enregistrer :

```text
Modèle
Nombre de requêtes
Tokens d'entrée
Tokens de sortie
Coût estimé
Utilisateur
Fonction utilisée
```

Cela permettra de mesurer les coûts réels avant d'ajouter d'autres modèles.

---

# 49. MVP

Le MVP ne doit pas chercher à implémenter toutes les idées futures.

Il doit se concentrer sur :

## A. Publier

- créer un compte ;
- créer un profil ;
- publier un travail ;
- publier un mémoire ;
- publier un article ;
- suivre la soumission.

## B. Découvrir

- rechercher ;
- filtrer ;
- consulter ;
- rechercher par sujet ;
- découvrir des travaux similaires.

## C. Comprendre

- PDF ;
- résumé IA ;
- questions/réponses ;
- explication pédagogique.

## D. Apprendre

- questions ;
- quiz ;
- recommandations ;
- historique ;
- favoris.

## E. Rechercher

- recherche sémantique ;
- comparaison ;
- exploration de travaux.

---

# 50. PARCOURS MVP DE L'ÉTUDIANT

```text
Inscription
   ↓
Profil académique
   ↓
Recherche d'un sujet
   ↓
Découverte de travaux
   ↓
Lecture d'un mémoire
   ↓
Question à Galileo
   ↓
Résumé / Explication
   ↓
Travaux similaires
   ↓
Favoris
   ↓
Approfondissement
   ↓
Création de son propre travail
   ↓
Upload
   ↓
Validation
   ↓
Publication
```

---

# 51. PARCOURS MVP DU CHERCHEUR

```text
Connexion
   ↓
Recherche d'un sujet
   ↓
Recherche sémantique
   ↓
Sélection de travaux
   ↓
Lecture
   ↓
Comparaison
   ↓
Analyse IA
   ↓
Veille
   ↓
Recherche personnelle
   ↓
Publication
```

---

# 52. CRITÈRES D'ACCEPTATION

Le MVP sera fonctionnel lorsqu'un étudiant pourra :

1. créer son compte ;
2. rechercher un sujet ;
3. découvrir les travaux d'autres étudiants ;
4. consulter un mémoire ;
5. poser une question sur le mémoire ;
6. obtenir un résumé ;
7. demander une explication ;
8. sauvegarder le travail ;
9. retrouver son historique ;
10. consulter des travaux similaires ;
11. publier son propre travail ;
12. suivre sa soumission ;
13. voir son travail publié après validation.

Le chercheur devra pouvoir :

1. rechercher un sujet ;
2. trouver des travaux pertinents ;
3. consulter plusieurs documents ;
4. comparer les documents ;
5. utiliser l'assistant ;
6. sauvegarder des documents ;
7. suivre des sujets ;
8. publier ses propres travaux.

---

# 53. PHASES DE DÉVELOPPEMENT

## Phase 1 — Stabilisation du Galileo existant

- inventaire ;
- tests ;
- nettoyage ;
- sécurité ;
- suppression des secrets ;
- suppression des composants inutiles ;
- correction des configurations.

## Phase 2 — Refactoring architecture

- monolithe modulaire ;
- PostgreSQL ;
- stockage R2 ;
- suppression progressive des dépendances distribuées.

## Phase 3 — Publication

- travaux ;
- mémoires ;
- articles ;
- workflow de soumission ;
- validation.

## Phase 4 — Recherche

- recherche ;
- filtres ;
- recherche sémantique ;
- similarité.

## Phase 5 — Intelligence documentaire

- extraction ;
- embeddings ;
- RAG ;
- DeepSeek ;
- résumé ;
- Q&A.

## Phase 6 — Expérience étudiante

- explication ;
- quiz ;
- apprentissage ;
- progression ;
- recommandations.

## Phase 7 — Expérience chercheur

- comparaison ;
- veille ;
- suivi de sujets ;
- exploration avancée.

## Phase 8 — Mise en production

- Heroku ;
- PostgreSQL ;
- R2 ;
- DeepSeek ;
- monitoring ;
- tests finaux.

---

# 54. ÉVOLUTIONS FUTURES

Après validation du MVP :

```text
MVP
 ↓
Recherche sémantique
 ↓
RAG
 ↓
Recommandation
 ↓
Profil d'apprentissage
 ↓
Veille intelligente
 ↓
Knowledge Graph
 ↓
Research Intelligence
```

Les futures versions pourront également intégrer :

- détection de similitude ;
- graphe des auteurs ;
- graphe des sujets ;
- analyse bibliographique ;
- citation tracking ;
- intégration de sources scientifiques externes ;
- espaces institutionnels ;
- corpus privés ;
- recherche multimodale ;
- modèles IA spécialisés.

---

# 55. MODÈLE ÉCONOMIQUE FUTUR

Galileo peut évoluer vers plusieurs modèles.

## Utilisateur gratuit

- recherche ;
- lecture ;
- publication selon les règles de la plateforme ;
- IA limitée.

## Utilisateur avancé

- davantage d'analyses IA ;
- recherche avancée ;
- veille ;
- fonctions supplémentaires.

## Institution

Une université pourra disposer de :

- dépôt institutionnel ;
- espace privé ;
- gestion des utilisateurs ;
- statistiques ;
- corpus institutionnel ;
- assistant IA sur son propre corpus.

La monétisation ne doit pas être une priorité du MVP si elle ralentit la mise en service.

---

# 56. DIFFÉRENCIATION DE GALILEO

Galileo doit se différencier par la combinaison de :

```text
PUBLICATION
     +
DÉCOUVERTE
     +
APPRENTISSAGE
     +
INTELLIGENCE ARTIFICIELLE
     +
RECHERCHE
```

La particularité du système est que les contenus produits par les utilisateurs alimentent progressivement la base de connaissances de Galileo.

```text
Étudiant A
   ↓
Publie un mémoire
   ↓
Galileo l'indexe
   ↓
Étudiant B le découvre
   ↓
Étudiant B apprend
   ↓
Étudiant B réalise son travail
   ↓
Étudiant B publie
   ↓
Galileo s'enrichit
```

Le même mécanisme fonctionne pour les chercheurs.

---

# 57. DÉFINITION FINALE DU PRODUIT

Galileo est :

> **une plateforme académique intelligente où les étudiants et les chercheurs peuvent publier leurs travaux, découvrir les productions d'autres personnes, développer leurs connaissances grâce à ces travaux et utiliser l'intelligence artificielle pour rechercher, comprendre, comparer et explorer les contenus académiques.**

Le produit repose sur une boucle fondamentale :

```text
          PUBLIER
             ↓
         DÉCOUVRIR
             ↓
            LIRE
             ↓
         COMPRENDRE
             ↓
          APPRENDRE
             ↓
          RECHERCHER
             ↓
           CRÉER
             ↓
          PUBLIER
```

Galileo doit donc devenir progressivement une **communauté académique augmentée par l'intelligence artificielle**, et non simplement une bibliothèque de documents ou un assistant conversationnel.