# Plan rôles, privilèges et dashboards

## Rôles
- **ADMIN** : tout accès. Soumissions (valider/rejeter/révisions), publications (CRUD), événements/équipe (CRUD), stats.
- **STAFF** : proche ADMIN sans gestion des rôles utilisateurs. Soumissions (valider/rejeter/révisions), publications (create depuis soumission), événements/équipe (CRUD), stats.
- **STUDENT** : soumissions (créer, lister ses propres, retirer), lecture publications/événements/équipe.
- **VIEWER** : lecture seule publications/événements/équipe.

## Back-end (galileo-ecriture et gateway)
- En-têtes propagés par le gateway vers services : `X-User-Id`, `X-User-Email`, `X-User-Role`.
- Service Écriture : RoleGuard déjà en place ; routes admin restreintes à ADMIN/STAFF ; soumissions restreintes à ADMIN/STAFF/STUDENT.
- Gateway (lecture/écriture) : s’assurer de transmettre `X-User-Role` depuis l’auth (Firebase custom claims ou mapping). Routes POST/PUT/DELETE events/team/publications doivent déjà être protégées côté gateway.

## Front-end
- Ajouter `role` dans AuthContext : récupérer depuis custom claims Firebase (idTokenResult.claims.role) sinon fallback VIEWER.
- Fournir helper `authFetch` injectant headers : `Authorization: Bearer <idToken>`, `X-User-Id`, `X-User-Email`, `X-User-Role`.
- Route guarding :
  - `/dashboard/admin` : ADMIN, STAFF (STAFF sans gestion rôles utilisateurs).
  - `/dashboard/student` : STUDENT (et ADMIN/STAFF en lecture éventuelle).
  - VIEWER : pas de dashboard privé.
- Navigation : masquer ou griser les actions non autorisées (Valider/Rejeter, CRUD événements/équipe).

## Dashboards (skeleton)
- **Admin/Staff** : cartes stats soumissions, liste soumissions en attente avec actions (Valider/Rejeter/Révisions), liens gestion événements/équipe/publications.
- **Student** : "Mes soumissions" (liste + statut + bouton retirer si EN_ATTENTE/EN_REVISION), bouton nouvelle soumission.
- **Viewer** : aucun dashboard, accès public seulement.

## Étapes d’implémentation
1) Étendre AuthContext avec rôle et extraction des claims.
2) Créer `authFetch` pour centraliser les en-têtes.
3) Adapter services API (soumission/event/team/publication) pour utiliser `authFetch`.
4) Ajouter routes protégées + composants dashboard (admin/staff/student) + guard.
5) Mettre à jour Header/menus selon rôle.
6) Tests manuels (soumission student, accès admin, refus viewer).
