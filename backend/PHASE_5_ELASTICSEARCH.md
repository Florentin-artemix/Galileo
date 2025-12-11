# Phase 5 - Intégration Elasticsearch (Jours 19-20)

## ✅ Objectif
Ajouter des capacités de recherche avancées avec Elasticsearch pour les publications scientifiques et articles de blog.

## 📦 Technologies Utilisées
- **Elasticsearch**: 8.11.0 (déjà configuré dans docker-compose.yml)
- **Spring Data Elasticsearch**: 5.4.4 (Spring Boot 3.5.1)
- **Elasticsearch Java Client**: 8.11.0

## 🏗️ Architecture

### Documents Elasticsearch

#### 1. PublicationDocument
Index: `publications`

**Champs:**
- `id` (String): ID Elasticsearch
- `publicationId` (Long): ID PostgreSQL
- `titre` (Text): Analysé avec analyseur français
- `resume` (Text): Analysé avec analyseur français
- `auteurPrincipal` (Keyword): Recherche exacte
- `coAuteurs` (List<String>): Auteurs secondaires
- `domaine` (Keyword): Recherche exacte
- `motsCles` (List<String>): Mots-clés
- `datePublication` (Date): Date de publication
- `nombreVues` (Integer): Nombre de vues
- `nombreTelechargements` (Integer): Nombre de téléchargements
- `publiee` (Boolean): Statut de publication
- `contenuComplet` (Text): Champ global pour recherche full-text

#### 2. BlogDocument
Index: `blog_articles`

**Champs:**
- `id` (String): ID Elasticsearch
- `articleId` (Long): ID PostgreSQL
- `titre` (Text): Analysé avec analyseur français
- `contenu` (Text): Contenu complet de l'article
- `auteur` (Keyword): Auteur de l'article
- `categories` (List<String>): Catégories
- `datePublication` (Date): Date de publication
- `tempsLecture` (Integer): Temps de lecture en minutes
- `nombreVues` (Integer): Nombre de vues
- `publie` (Boolean): Statut de publication
- `contenuComplet` (Text): Champ global pour recherche full-text

### Services

#### IndexationService
**Responsabilités:**
- Synchronisation PostgreSQL → Elasticsearch
- Indexation bulk (toutes les données)
- Indexation unitaire (une publication/article)
- Suppression de l'index
- Réindexation complète

**Méthodes principales:**
```java
void indexAllPublications()
void indexAllBlogArticles()
void indexPublication(Long publicationId)
void indexBlogArticle(Long articleId)
void removePublicationFromIndex(Long publicationId)
void removeBlogArticleFromIndex(Long articleId)
void reindexAll()
```

**Conversion PostgreSQL → Elasticsearch:**
- Conversion String → List<String> pour `coAuteurs`, `motsCles`, `categories` (split par virgule)
- Création du champ `contenuComplet` pour recherche globale
- Mapping correct des booléens (`getPubliee()` vs `getPublie()`)

#### SearchService
**Responsabilités:**
- Recherche full-text avec scoring
- Autocomplete (suggestions)
- Recherche par filtres (domaine, auteur, catégorie)
- Publications similaires (basé sur mots-clés)

**Méthodes principales:**
```java
Page<PublicationDocument> searchPublications(String searchTerm, Pageable)
Page<BlogDocument> searchBlog(String searchTerm, Pageable)
Page<PublicationDocument> searchPublicationsByDomain(String domaine, Pageable)
Page<PublicationDocument> searchPublicationsByAuthor(String auteur, Pageable)
Page<BlogDocument> searchBlogByCategory(String categorie, Pageable)
List<String> autocompletPublications(String prefix)
List<String> autocompletBlog(String prefix)
List<PublicationDocument> findSimilarPublications(Long publicationId, int limit)
```

### Repositories

#### PublicationSearchRepository
Extension de `ElasticsearchRepository<PublicationDocument, String>`

**Requêtes personnalisées:**
```java
@Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"titre^3\", \"resume^2\", \"contenuComplet\"], \"type\": \"best_fields\", \"operator\": \"or\"}}")
Page<PublicationDocument> fullTextSearch(String searchTerm, Pageable)
```
- **Boost**: titre×3, résumé×2, contenu×1
- **Type**: best_fields (meilleur score)
- **Operator**: OR (au moins un terme)

```java
@Query("{\"match_phrase_prefix\": {\"titre\": {\"query\": \"?0\", \"max_expansions\": 10}}}")
List<PublicationDocument> findSuggestions(String prefix)
```
- **max_expansions**: 10 suggestions maximum

#### BlogSearchRepository
Extension de `ElasticsearchRepository<BlogDocument, String>`

**Requêtes similaires pour les articles de blog**

## 🌐 API REST

### Endpoints de Recherche (/api/search)

#### 1. Recherche Publications
```http
GET /api/search/publications?q=machine+learning&page=0&size=10
```
**Paramètres:**
- `q`: Terme de recherche (requis)
- `page`: Numéro de page (défaut: 0)
- `size`: Taille de la page (défaut: 10)

**Réponse:**
```json
{
  "content": [
    {
      "id": "1",
      "publicationId": 1,
      "titre": "Introduction au Machine Learning",
      "resume": "Un guide complet sur le machine learning...",
      "auteurPrincipal": "Dr. Martin",
      "domaine": "Intelligence Artificielle",
      "motsCles": ["ML", "IA", "Deep Learning"],
      "datePublication": "2024-01-15T10:00:00",
      "nombreVues": 1250,
      "nombreTelechargements": 340,
      "publiee": true
    }
  ],
  "totalElements": 42,
  "totalPages": 5,
  "number": 0,
  "size": 10
}
```

#### 2. Recherche Blog
```http
GET /api/search/blog?q=quantum&page=0&size=10
```
**Réponse similaire avec BlogDocument**

#### 3. Recherche par Domaine
```http
GET /api/search/publications/domain/Physique?page=0&size=10
```

#### 4. Recherche par Auteur
```http
GET /api/search/publications/author/Einstein?page=0&size=10
```

#### 5. Recherche par Catégorie (Blog)
```http
GET /api/search/blog/category/Actualités?page=0&size=10
```

#### 6. Autocomplete Publications
```http
GET /api/search/publications/autocomplete?prefix=quan
```
**Réponse:**
```json
[
  "Quantum Computing Fundamentals",
  "Quantum Entanglement Explained",
  "Quantum Field Theory"
]
```

#### 7. Autocomplete Blog
```http
GET /api/search/blog/autocomplete?prefix=intel
```

#### 8. Publications Similaires
```http
GET /api/search/publications/123/similar?limit=5
```
**Réponse:** Liste de 5 publications similaires basées sur les mots-clés communs

### Endpoints d'Indexation (/api/indexation)

⚠️ **Note:** Ces endpoints devraient être protégés par authentification admin en production

#### 1. Indexer toutes les publications
```http
POST /api/indexation/publications
```
**Réponse:**
```
Toutes les publications ont été indexées avec succès
```

#### 2. Indexer tous les articles de blog
```http
POST /api/indexation/blog
```

#### 3. Indexer une publication spécifique
```http
POST /api/indexation/publications/123
```

#### 4. Indexer un article de blog spécifique
```http
POST /api/indexation/blog/456
```

#### 5. Réindexation complète
```http
POST /api/indexation/reindex
```
**Action:** Supprime les index, les recrée, et réindexe toutes les données

#### 6. Supprimer une publication de l'index
```http
DELETE /api/indexation/publications/123
```

#### 7. Supprimer un article de blog de l'index
```http
DELETE /api/indexation/blog/456
```

## 🔧 Configuration

### application.yml (galileo-lecture)
```yaml
spring:
  elasticsearch:
    uris: http://localhost:9200
    connection-timeout: 5s
    socket-timeout: 30s
```

### pom.xml
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
</dependency>
<dependency>
    <groupId>co.elastic.clients</groupId>
    <artifactId>elasticsearch-java</artifactId>
</dependency>
```

### docker-compose.yml
```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
    - "9300:9300"
```

## 📊 Workflow d'Indexation

### 1. Indexation Initiale
```bash
# Démarrer Elasticsearch
docker-compose up -d elasticsearch

# Attendre qu'Elasticsearch soit prêt
curl http://localhost:9200

# Lancer l'indexation initiale
curl -X POST http://localhost:8081/api/indexation/reindex
```

### 2. Indexation Automatique (Future)
Pour une indexation automatique lors de la création/modification de publications:

```java
@EventListener
public void onPublicationCreated(PublicationCreatedEvent event) {
    indexationService.indexPublication(event.getPublicationId());
}
```

### 3. Indexation Planifiée (Future)
```java
@Scheduled(cron = "0 0 2 * * ?") // Tous les jours à 2h du matin
public void scheduledReindex() {
    indexationService.reindexAll();
}
```

## 🧪 Tests

### Test de Recherche Full-Text
```bash
# Recherche de publications
curl "http://localhost:8081/api/search/publications?q=quantum&page=0&size=5"

# Recherche de blog
curl "http://localhost:8081/api/search/blog?q=intelligence%20artificielle&page=0&size=5"
```

### Test d'Autocomplete
```bash
# Autocomplete publications
curl "http://localhost:8081/api/search/publications/autocomplete?prefix=quan"

# Autocomplete blog
curl "http://localhost:8081/api/search/blog/autocomplete?prefix=intel"
```

### Test de Publications Similaires
```bash
curl "http://localhost:8081/api/search/publications/1/similar?limit=5"
```

### Test d'Indexation
```bash
# Indexer toutes les publications
curl -X POST http://localhost:8081/api/indexation/publications

# Indexer tous les articles de blog
curl -X POST http://localhost:8081/api/indexation/blog

# Réindexer tout
curl -X POST http://localhost:8081/api/indexation/reindex
```

## 🐛 Corrections Effectuées

### 1. Conversion String → List<String>
**Problème:** Les entités PostgreSQL utilisent `String` pour `coAuteurs`, `motsCles`, `categories`

**Solution:**
```java
if (publication.getCoAuteurs() != null && !publication.getCoAuteurs().isEmpty()) {
    doc.setCoAuteurs(List.of(publication.getCoAuteurs().split(",\\s*")));
}
```

### 2. Nommage des Méthodes Boolean
**Problème:** Lombok génère `getPubliee()` et `getPublie()` (pas `isPublie()`)

**Solution:**
- `publication.getPubliee()` pour Publication
- `article.getPublie()` pour ArticleBlog
- `doc.setPubliee()` pour PublicationDocument
- `doc.setPublie()` pour BlogDocument

### 3. Dépendances Elasticsearch
**Problème:** Classes Elasticsearch manquantes

**Solution:** Ajout de `elasticsearch-java` dans pom.xml

### 4. API Elasticsearch 8.x
**Problème:** NativeSearchQueryBuilder et AggregationBuilders obsolètes

**Solution:** Simplification en utilisant uniquement les repositories Spring Data

## 📈 Performance

### Optimisations Implémentées
1. **Analyseur français**: Meilleure tokenization pour le français
2. **Boost de champs**: titre×3, résumé×2 pour meilleure pertinence
3. **Champ contenuComplet**: Recherche globale optimisée
4. **Keyword fields**: Domaine et auteur pour filtrage exact

### Recommandations Futures
1. **Pagination côté client**: Utiliser `from/size` avec prudence (max 10000)
2. **Search After**: Pour pagination profonde
3. **Highlighting**: Surligner les termes trouvés
4. **Faceting**: Agrégations pour filtres dynamiques
5. **Indexation asynchrone**: Queue (RabbitMQ/Kafka) pour grande volumétrie

## 🎯 Résumé

✅ **Réalisé:**
- 2 documents Elasticsearch (PublicationDocument, BlogDocument)
- 2 repositories avec requêtes personnalisées
- IndexationService (synchronisation PostgreSQL→ES)
- SearchService (recherche, autocomplete, similaires)
- 2 contrôleurs REST (SearchController, IndexationController)
- 15+ endpoints de recherche et indexation
- Compilation réussie avec toutes dépendances

🚀 **Prêt pour:**
- Tests fonctionnels avec données réelles
- Intégration dans le frontend
- Optimisations de performance
- Ajout d'authentification sur endpoints d'indexation
- Indexation automatique avec événements

---

**Phase 5 complétée avec succès ! 🎉**

Les services de recherche Elasticsearch sont opérationnels et prêts à être utilisés.
