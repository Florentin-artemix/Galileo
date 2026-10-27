# Plan de correction — Assistant IA & Lecture de publication (`/#/publication/1`)

## 1. Diagnostic des deux problèmes

### A. Bannière d'accueil fixe et message tronqué dans `/#/ai-assistant`
1. **Affichage permanent de `.ai-welcome-state`** : Dans `src/pages/AIAssistantPage.tsx`, le bloc `.ai-welcome-state` (*« Bonjour, comment puis-je vous aider ? ... »*) est affiché en permanence au-dessus de `.ai-message-list` tant que l'onglet `Discuter` (`CHAT`) est actif, même lorsque des messages ont déjà été envoyés ou reçus.
2. **Troncature du haut des réponses longues** : Dans `src/pages/ai-assistant.css`, le conteneur `.ai-message-list` possède la règle `justify-content: center;`. Dans un conteneur flex vertical avec `overflow-y: auto`, centrer verticalement des messages plus hauts que la zone de conversation pousse le début du message au-dessus de la zone déroulable, ce qui coupe le début de la réponse de l'IA (comme visible sur la capture d'écran).

### B. Page blanche sur `/#/publication/1` (`SinglePublicationPage.tsx`)
1. **Crash React au premier rendu (`TypeError: Cannot read properties of null (reading 'type')`)** :
   Dans `src/pages/SinglePublicationPage.tsx` (lignes 125–130), le tableau `infoItems` accède directement à `publication.type`, `publication.academicYear` et `publication.date` **sans chaînage optionnel (`?.`)** et **avant** les gardes `if (detailState === 'loading')` et `if (!publication)`.
   Lorsqu'on accède à `/#/publication/1`, `publication` vaut `null` pendant le chargement initial : React lève immédiatement une exception non interceptée et démonte toute l'application, provoquant une page blanche.
2. **Sécurisation des données et du lecteur PDF (`PdfViewer.tsx`)** :
   Certaines propriétés (`publication.tags`, `publication.title`, `publication.domain`, `publication.summary`, `publication.authors`) et l'affichage PDF sur navigateur mobile doivent également être protégés pour éviter tout crash ou cadre vide si une propriété est absente ou si le navigateur mobile ne prévisualise pas les `blob:` PDF dans un `<iframe>`.

---

## 2. Modifications prévues

### 1. Masquage du message d'accueil dès le début de la conversation (`src/pages/AIAssistantPage.tsx` & `src/pages/ai-assistant.css`)
- **Condition d'affichage** : Afficher `.ai-welcome-state` uniquement lorsqu'aucune conversation n'a démarré (`!historyLoading && messages.length === 0 && !pendingMessage`). Dès que l'utilisateur envoie un message (`pendingMessage`) ou qu'une conversation existante contient des messages (`messages.length > 0`), le bloc *« Bonjour, comment puis-je vous aider ? ... »* est complètement retiré pour laisser tout l'espace à la conversation.
- **Alignement et défilement de `.ai-message-list`** : Remplacer `justify-content: center` par `justify-content: flex-start` sur `.ai-message-list` dans `src/pages/ai-assistant.css` (tout en conservant le centrage de `.ai-empty-state` via `flex: 1`) afin que le haut des messages de l'assistant ne soit jamais coupé.

### 2. Correction de la page blanche sur `/#/publication/1` (`src/pages/SinglePublicationPage.tsx` & `src/components/PdfViewer.tsx`)
- **Sécurisation de `SinglePublicationPage.tsx`** :
  - Utiliser le chaînage optionnel (`publication?.type`, `publication?.academicYear`, `publication?.date`) dans `infoItems` et sécuriser `publication?.tags ?? []`, `publication?.authors ?? []`, `publication?.title`, `publication?.domain`, `publication?.summary`.
- **Amélioration de la lecture PDF (`src/components/PdfViewer.tsx`)** :
  - Ajouter dans la barre d'outils du lecteur PDF un bouton permettant d'ouvrir le PDF dans un nouvel onglet / télécharger directement le fichier si la prévisualisation intégrée `<iframe>` du navigateur (notamment sur mobile Android/iOS) ne s'affiche pas.

---

## 3. Vérification
- Compilation complète de l'application (`compile_applet`) pour vérifier l'absence d'erreurs TypeScript et le bon assemblage du bundle.
