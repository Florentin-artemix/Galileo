# Adaptation Mobile Complète & Ergonomie Petits Écrans (≥ 320px) — Plateforme Galileo

Ce plan adapte l'ensemble de la plateforme académique Galileo aux smartphones et très petits écrans (jusqu'à **320px** de largeur type iPhone SE et Android compacts), élimine tout débordement horizontal, garantit des cibles tactiles confortables ($\ge 44\text{px}$) et introduit une barre de bascule rapide **« Document PDF / Assistant IA / Infos »** sur la page de lecture d'une publication.

---

## Revue Utilisateur & Décisions Confirmées

> [!IMPORTANT]
> Les choix suivants ont été confirmés lors de la phase de clarification et gouvernent l'architecture responsive :

- **Périmètre confirmé** : Adaptation **de bout en bout sur toute la plateforme** (En-tête & navigation mobile, Accueil Découverte, Catalogue des publications, Lecture de publication & lecteur PDF, Assistant IA, Générateur et session de Quiz, Bibliothèque personnelle, Soumission de travaux et Tableaux de bord).
- **Organisation mobile de la page de lecture d'une publication** : **Barre d'onglets / bascule rapide « Document PDF » ↔ « Assistant IA » ↔ « Détails & Sommaire »** sur mobile et tablette compacte, permettant de passer instantanément du PDF à l'assistant IA sans faire défiler toute la page, et de basculer automatiquement vers l'onglet Document lorsqu'on clique sur une référence de page (`Ouvrir à la page X ↗`).
- **Largeur minimale garantie sans débordement** : **320px** (`overflow-x: hidden` maîtrisé, grilles fluides `minmax(0, 1fr)`, contrôles adaptatifs et typographie fluide `clamp(...)`).

---

## 1. Vue d'Ensemble & Valeur Ajoutée

- **Ce que cela apporte** : Une expérience mobile fluide et lisible sur tous les smartphones (de 320px à 430px) ainsi que sur tablettes, tout en conservant intégralement la mise en page multi-colonnes sur grand écran (1440px).
- **Public cible** : Étudiants, enseignants et chercheurs consultant des cours PDF, générant des fiches de révision IA ou passant des quiz d'auto-évaluation depuis leur téléphone.
- **Valeur clé** :
  - **Zéro débordement horizontal à 320px** sur les barres d'outils PDF, les sélecteurs de mode IA, les puces de métadonnées de quiz et les tableaux de bord.
  - **Consultation simultanée PDF + IA sur mobile** grâce au sélecteur d'onglets dédié qui évite les allers-retours verticaux interminables.
  - **Ergonomie tactile native** : zones de toucher d'au moins $44 \times 44\text{px}$ sur les boutons d'action, la pagination PDF et la navigation mobile.

---

## 2. Expérience Utilisateur & Design Visuel Mobile

### Flux Utilisateur Clés sur Petit Écran (320px – 430px)

1. **Navigation Globale & En-tête Compact** :
   - Sur mobile ($\le 640\text{px}$), la barre supérieure reste compacte ($\le 60\text{px}$, respectant le plafond de 15 % de hauteur sticky) avec accès direct à la recherche, au thème, aux notifications et au menu mobile structuré en grille claire avec boutons d'action pleine largeur.
2. **Lecture de Publication avec Bascule Rapide (Document / Assistant IA / Infos)** :
   - Sur les écrans mobiles et tablettes ($\le 1120\text{px}$), une barre d'onglets segmentée fixe sous l'en-tête de lecture permet de choisir entre :
     - **Document PDF** (résumé + lecteur PDF avec barre d'outils condensée sur 2 lignes propres à 320px et bouton *Ouvrir le PDF*).
     - **Assistant IA** (suggestions rapides, fiches de révision formatées et champ de question directement accessible dans la zone du pouce).
     - **Infos & Progression** (métadonnées, disponibilité PDF et progression de lecture).
   - Cliquer sur **« Ouvrir à la page X ↗ »** dans une réponse de l'assistant IA bascule automatiquement sur l'onglet **Document PDF** et positionne le lecteur à la page demandée.
3. **Espace Assistant IA sur Mobile** :
   - Les sélecteurs de mode (*Général*, *Document*, *Recherche*, *Apprentissage*) défilent horizontalement sans coupure ou s'adaptent en grille compacte à 320px.
   - Le sélecteur de **Publication liée** est accessible immédiatement en haut de l'espace de travail sur mobile afin que l'étudiant puisse lier un PDF avant de poser sa question sans devoir chercher le panneau latéral tout en bas de la page.
4. **Catalogue, Accueil, Bibliothèque, Soumission & Quiz à 320px** :
   - **Accueil Découverte** : La carte vedette (*À la une*) empile proprement la couverture et le texte en dessous de 380px pour éviter toute compression du titre.
   - **Quiz** : Les 3 pastilles de métadonnées et l'étape de progression en 4 phases s'adaptent en grille flexible sans déborder à 320px ; chaque option de réponse offre une zone tactile confortable ($\ge 44\text{px}$).
   - **Tableaux de bord (Étudiant, Staff, Admin)** : Les grilles de statistiques et tableaux de gestion disposent d'un conteneur à défilement horizontal fluide ou d'un empilement en cartes sur mobile.

### Identité Visuelle & Garde-fous Ergonomiques
- **Hiérarchie typographique fluide** : Titres principaux en `clamp(1.35rem, 5vw, 2.25rem)` avec `text-wrap: balance`, corps de texte lisible sans zoom forcé, et champs de saisie calibrés pour éviter le zoom automatique intempestif sur iOS Safari.
- **Palette & Contraste** : Conservation stricte des jetons de couleur Galileo (Bleu nuit `#0b1e38`, Sarcelle `#00838f`, surfaces claires `#f8f9fa` / `#ffffff` et mode sombre `#0b1e38` / `#102744`) avec contraste WCAG AA.

---

## 3. Décisions Produit & Arbitrages Techniques

- **Décision 1 : Système d'onglets mobile sur la page de lecture (`Document` | `Assistant IA` | `Infos`)**
  - *Approche choisie* : Afficher un sélecteur segmenté sur mobile/tablette ($\le 1120\text{px}$) qui affiche la vue active tout en gardant les composants montés (ou synchronisés) pour préserver l'état de la conversation IA et la page courante du PDF.
  - *Pourquoi* : Sur un écran de 320px à 390px, empiler les métadonnées, le résumé, le lecteur PDF de 500px et le panneau IA oblige l'utilisateur à faire défiler plus de 2000px pour lire une fiche de révision puis vérifier une page du PDF.
- **Décision 2 : Accès rapide au contexte « Publication liée » dans l'Assistant IA sur mobile**
  - *Approche choisie* : Permettre de sélectionner la publication liée directement en haut de la conversation sur petit écran tout en conservant le panneau latéral complet sur grand écran.
  - *Pourquoi* : En mode Document sur smartphone, le panneau latéral Contexte se retrouve sous la boîte de discussion ; remonter le sélecteur de publication liée garantit un flux immédiat.
- **Décision 3 : Barre d'outils PDF adaptative à 320px**
  - *Approche choisie* : Répartir les contrôles de pagination (`Précédent`, indicateur `Page X / Y`, `Suivant`), le champ d'accès direct à une page et le lien `Ouvrir le PDF` sur une grille fluide sans largeur fixe bloquante.
  - *Pourquoi* : Évite tout dépassement horizontal sur les écrans de 320px.

---

## 4. Architecture Technique & Flux d'Interactions

### Schéma d'Architecture Responsive

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    En-tête Global & Menu Mobile (≥ 320px)               │
│  [Logo Galileo]            [Recherche] [Thème] [Notifs] [Menu Tactile]  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌──────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────┐
│ Lecture Publication  │  │   Page Assistant IA     │  │ Accueil / Catalogue  │
│  Bascule Mobile :    │  │                         │  │ Quiz / Soumission /  │
│  [PDF] [IA] [Infos]  │  │ [Modes & Action Tabs]   │  │ Tableaux de bord     │
│         │            │  │ [Sélecteur PDF Lié]     │  │                      │
│  Clic "Page X ↗" ────┼─►│ [Discussion Formatée]   │  │ Grilles 1 col ≤640px │
│  Bascule auto -> PDF │  │ [Zone Saisie Tactile]   │  │ Cibles ≥ 44px        │
└──────────────────────┘  └─────────────────────────┘  └──────────────────────┘
```

### Correspondance des États & Interactions
- **Bascule mobile de publication** : Un état local `mobileActiveTab` (`'document' | 'ai' | 'info'`) contrôle la section visible sous `1120px` (sur ordinateur `> 1120px`, les 3 colonnes restent toutes affichées côte à côte comme actuellement). Lorsque l'utilisateur clique sur `Ouvrir à la page X ↗` dans l'assistant IA, le gestionnaire met à jour `currentPage`, active automatiquement `mobileActiveTab = 'document'` et fait défiler jusqu'au lecteur PDF.
- **Barre d'outils du lecteur PDF** : Réorganisation flexible des contrôles de navigation et du formulaire « Aller à la page » pour tenir sur 320px de large sans coupure ni débordement.
- **Grilles et formulaires multi-pages** : Ajustement des règles `@media (max-width: 640px)` et ajout d'un palier `@media (max-width: 380px)` sur l'accueil, le catalogue, l'assistant IA, les quiz, la soumission de publication, la bibliothèque et les tableaux de bord pour garantir zéro débordement horizontal (`100vw`).
