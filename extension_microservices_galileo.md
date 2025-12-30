# Extension de l’architecture microservices – Projet Galileo

⚠️ **Source de vérité : le code backend existant**  
Ce document s’appuie sur l’architecture backend actuelle (microservices Spring Boot + gateway) et sur les capacités réellement observées. Il définit **quels microservices ajouter**, **pourquoi**, **comment les exploiter**, ainsi que **les technologies et bases de données adaptées**.

---

## 1. État actuel de l’architecture (rappel factuel)

Microservices existants :
- `galileo-gateway` → point d’entrée unique
- `galileo-lecture` → lecture de contenus
- `galileo-ecriture` → écriture / soumission

Technologies constatées :
- Java / Spring Boot
- Docker
- Architecture REST
- Elasticsearch déjà présent dans l’écosystème (recherche)

👉 L’architecture est **déjà pensée pour l’extension horizontale**.

---

## 2. Pourquoi ajouter de nouveaux microservices

Les services actuels couvrent **le contenu**, mais pas :
- la personnalisation utilisateur
- la communication asynchrone
- l’analyse produit

Ajouter ces responsabilités dans `lecture` ou `ecriture` créerait :
- des services trop lourds
- une logique métier mélangée

👉 Les nouveaux microservices permettent :
- clarté architecturale
- évolutivité
- meilleure expérience utilisateur

---

## 3. Microservices recommandés

---

## 3.1 `galileo-user-profile`

### Rôle
Gestion de tout ce qui est **spécifique à l’utilisateur**.

### Responsabilités
- Profil utilisateur
- Préférences
- Favoris
- Historique de lecture

### API typique
```http
GET  /users/{id}/profile
POST /users/{id}/favorites
GET  /users/{id}/history
```

### Technologie recommandée
- **Spring Boot** (cohérence avec l’existant)
- **Spring Data JPA**

### Base de données
- **PostgreSQL**

#### Pourquoi PostgreSQL ?
- Données relationnelles claires (user → favoris → contenus)
- Intégrité forte
- Transactions simples

### Exploitation frontend
- Dashboards enrichis
- Favoris
- Personnalisation de l’UI

---

## 3.2 `galileo-notification`

### Rôle
Gestion des **notifications utilisateur**.

### Responsabilités
- Notifications internes
- Emails
- (évolutif) push notifications

### API typique
```http
POST /notifications
GET  /notifications?userId=123
```

### Technologie recommandée
- **Spring Boot**
- **Spring Events / Async**

### Base de données
- **MongoDB**

#### Pourquoi MongoDB ?
- Données orientées événements
- Schéma flexible
- Volume potentiellement élevé

### Exploitation frontend
- Centre de notifications
- Feedback utilisateur immédiat
- Amélioration de la rétention

---

## 3.3 `galileo-analytics`

### Rôle
Analyse et métriques produit.

### Responsabilités
- Statistiques de lecture
- Activité utilisateur
- Données admin

### Technologie recommandée
- **Spring Boot**
- **Spring Batch / Async**

### Base de données
- **ClickHouse** ou **PostgreSQL (analytics)**

#### Pourquoi ?
- Agrégations rapides
- Lecture intensive

### Exploitation frontend
- AdminDashboard réel
- Décisions produit basées sur des données

---

## 3.4 `galileo-search`

### Statut
✔ **Déjà partiellement présent** (Elasticsearch détecté)

### Rôle
- Recherche plein texte
- Filtres avancés
- Suggestions

### Technologie
- **Elasticsearch**
- Indexation via `galileo-lecture` / `ecriture`

### Exploitation frontend
- Recherche globale
- Navigation rapide
- UX moderne

👉 Aucun nouveau microservice lourd à créer, seulement :
- une bonne stratégie d’indexation
- des endpoints dédiés via le gateway

---

## 4. Intégration via le Gateway (règle stricte)

```
Frontend
   ↓
Galileo Gateway
   ↓
Microservices
```

Règles :
- Le frontend ne connaît **que le gateway**
- Authentification et rôles validés au gateway
- Les microservices restent indépendants

---

## 5. Communication inter-services (évolution)

Court terme :
- REST synchrone

Moyen terme :
- Events (Kafka / RabbitMQ)
  - soumission validée
  - notification envoyée
  - indexation Elasticsearch

---

## 6. Ordre de mise en œuvre recommandé

1. `galileo-user-profile`
2. `galileo-notification`
3. Exploitation complète d’Elasticsearch
4. `galileo-analytics`

---

## 7. Bénéfices attendus

- Architecture plus claire
- UX personnalisée
- Meilleure observabilité
- Scalabilité maîtrisée

---

## 8. Conclusion

L’architecture Galileo est **mûre pour évoluer**.

L’ajout de microservices ciblés :
- respecte la philosophie actuelle
- améliore l’expérience utilisateur
- prépare le projet à une montée en charge réelle

👉 Ce document peut servir de **référence d’architecture** pour les prochaines évolutions backend.

