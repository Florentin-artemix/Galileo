# Analyse croisée Frontend ↔ Backend – Projet Galileo

⚠️ **Source de vérité : le code uniquement (frontend + backend)**  
Ce document croise **les appels réels du frontend** avec **les capacités effectives du backend** identifiées dans `galileo-gateway`, `galileo-lecture` et `galileo-ecriture`.

---

## 1. Méthodologie

1. Identification des pages frontend (`pages/*.tsx`)
2. Identification des services frontend (`services/*.ts`, hooks)
3. Correspondance avec :
   - routes exposées par le gateway
   - services lecture / écriture
4. Vérification des données :
   - disponibles backend
   - effectivement utilisées frontend

---

## 2. Correspondance pages frontend ↔ services backend

### 2.1 Pages de consultation

#### `HomePage`
- Données affichées : contenus récents / mis en avant
- Backend utilisé : `galileo-lecture`
- Statut : ✔ cohérent

⚠️ Limite : pas de pagination ni critères côté backend exploités

---

#### `ResourcesPage`
- Appels GET (liste de livres / ressources)
- Backend : `galileo-lecture`
- Paramètres utilisés : basiques (page / size)

⚠️ Données backend non exploitées :
- catégories
- métadonnées enrichies
- tris avancés

---

#### `SingleResourcePage`
- GET par ID
- Backend : `galileo-lecture`
- Statut : ✔ aligné

❌ Absence de :
- contenus liés
- navigation contextuelle

---

### 2.2 Pages publications / blogs

#### `PublicationsPage` / `BlogPage`
- Liste + détails
- Backend : `galileo-lecture`

⚠️ Le backend supporte plus de métadonnées que le frontend n’affiche :
- auteur
- statut éditorial
- date de mise à jour

---

#### `SinglePublicationPage` / `SingleBlogPostPage`
- Lecture pure
- Backend : `galileo-lecture`
- Statut : ✔ cohérent

❌ Pas de mode lecture optimisé alors que le backend est stateless et adapté

---

## 3. Pages de soumission et écriture

### `SubmissionPage`
- POST de contenu
- Backend : `galileo-ecriture`
- Rôles : `STUDENT`, `STAFF`, `ADMIN`

⚠️ Problèmes constatés :
- Pas de gestion d’état (brouillon / soumis / validé)
- Pas de retour structuré du backend

👉 Backend partiellement prêt, frontend sous-exploité

---

## 4. Dashboards par rôle

### `ViewerDashboard`
- Données statiques
- Aucun appel backend dédié

❌ Opportunité manquée : statistiques lecture (backend absent)

---

### `StudentDashboard`
- Liste de soumissions
- Backend : `galileo-ecriture`

⚠️ Données backend minimales
- Pas de feedback
- Pas d’historique détaillé

---

### `StaffDashboard`
- Vue globale des soumissions
- Backend : `galileo-ecriture`

❌ Manque backend :
- commentaires
- actions tracées

---

### `AdminDashboard`
- Vue globale
- Backend : mix lecture / écriture

⚠️ Backend non exploité pour :
- statistiques
- audit

---

## 5. Incohérences front ↔ back identifiées

| Sujet | Constat |
|-----|--------|
| Recherche | Backend possible, frontend absent |
| Filtres | Backend partiel, frontend minimal |
| États de contenu | Backend flou, frontend absent |
| Feedback utilisateur | Frontend absent, backend non standardisé |
| Personnalisation | Frontend inexistant, backend inexistant |

---

## 6. Opportunités immédiates (sans refonte backend)

✔ Recherche simple (GET + paramètres)
✔ Filtres basiques
✔ Pagination enrichie
✔ Mode lecture frontend
✔ Améliorations accessibilité

---

## 7. Fonctionnalités bloquées par le backend

❌ Favoris utilisateur
❌ Historique de lecture
❌ Notifications
❌ Commentaires
❌ Recommandations

👉 Ces features nécessitent de **nouvelles entités backend**.

---

## 8. Recommandations techniques

1. Normaliser les réponses API (statut, message, data)
2. Ajouter des états de contenu (`DRAFT`, `PENDING`, `PUBLISHED`)
3. Exposer plus de métadonnées côté lecture
4. Préparer des endpoints analytics (admin)

---

## 9. Conclusion

Le frontend Galileo est **globalement aligné** avec le backend pour la consultation et la soumission simple.

Cependant :
- le backend est **sous-exploité en lecture**
- le frontend manque de **fonctionnalités transverses**
- certaines attentes UX sont **impossibles sans évolution backend**

👉 Ce document sert de base fiable pour définir **des features globales réalistes**, alignées avec les capacités réelles du système.

