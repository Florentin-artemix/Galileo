# Améliorations des rôles – Projet Galileo

Ce document décrit **les améliorations à apporter à la gestion des rôles**, basées **exclusivement sur l’analyse du code existant**.

Rôles actuels dans le code :
- `VIEWER`
- `STUDENT`
- `STAFF`
- `ADMIN`

---

## 1. Problèmes actuels identifiés

### 1.1 Logique de rôles trop côté frontend
- Le rôle est partiellement stocké / utilisé côté client
- Certaines actions sensibles sont conditionnées uniquement par l’UI

⚠️ Risque : élévation de privilèges si le backend n’est pas strict

---

### 1.2 Différences fonctionnelles insuffisantes

| Rôle | Problème |
|-----|---------|
| VIEWER | Trop proche d’un utilisateur non connecté |
| STUDENT | Peu de valeur ajoutée par rapport à VIEWER |
| STAFF | Manque d’outils dédiés de modération |
| ADMIN | Trop de responsabilités non tracées |

---

## 2. Améliorations par rôle

---

## 2.1 VIEWER (lecture uniquement)

### État actuel
- Lecture du contenu public
- Aucun état persistant

### Améliorations recommandées

#### Fonctionnelles
- Recherche avancée (titre, auteur, catégorie)
- Mode lecture optimisé (mobile-first)
- Accessibilité (ARIA, contraste, navigation clavier)

#### Techniques
- Aucun accès API nécessitant un token
- Cache agressif (lecture seule)

---

## 2.2 STUDENT (contributeur)

### État actuel
- Soumission de contenu basique

### Améliorations recommandées

#### Fonctionnelles
- Tableau de bord « Mes soumissions »
- Statuts clairs :
  - `brouillon`
  - `en attente`
  - `accepté`
  - `refusé`
- Feedback des modérateurs
- Favoris & historique personnel

#### Techniques
- Permissions backend : `submit`, `view_own`
- Validation serveur obligatoire

---

## 2.3 STAFF (modérateur)

### État actuel
- Modération partielle

### Améliorations recommandées

#### Fonctionnelles
- File de modération centralisée
- Filtres par :
  - statut
  - auteur
  - date
- Commentaires internes (non visibles aux STUDENT)
- Historique des décisions

#### Techniques
- Permissions backend : `moderate`, `view_all`
- Journalisation des actions

---

## 2.4 ADMIN (super-utilisateur)

### État actuel
- Accès global non tracé

### Améliorations recommandées

#### Fonctionnelles
- Dashboard d’administration
- Gestion des rôles via interface
- Suspension / désactivation de comptes
- Statistiques globales

#### Sécurité
- Logs d’audit (qui / quand / quoi)
- Double validation pour actions critiques

---

## 3. Centralisation des permissions (priorité)

### Problème
- Permissions dispersées

### Solution recommandée

```ts
ROLE_PERMISSIONS = {
  VIEWER: ['view_public'],
  STUDENT: ['view_public', 'submit', 'view_own'],
  STAFF: ['view_public', 'submit', 'moderate', 'view_all'],
  ADMIN: ['*']
}
```

- Vérification **backend uniquement**
- Le frontend sert uniquement à l’affichage conditionnel

---

## 4. Ordre de mise en œuvre recommandé

1. RBAC backend strict
2. Séparation claire STUDENT / STAFF
3. Dashboard STUDENT
4. Outils STAFF
5. Audit & logs ADMIN

---

## 5. Bénéfices attendus

- Sécurité renforcée
- Meilleure évolutivité
- Expérience utilisateur claire par rôle
- Base saine pour de futures fonctionnalités

---

## 6. Conclusion

La structure actuelle des rôles est une **bonne base**, mais nécessite :
- une meilleure séparation des responsabilités
- un contrôle backend strict
- des fonctionnalités dédiées par rôle

Ces améliorations permettront à Galileo de devenir une plateforme robuste, sécurisée et scalable.

