# Plan de correction — Déblocage du lecteur PDF (`Chargement du document...`)

Le lecteur PDF télécharge bien le fichier de la publication (comme l'indiquent `Page 1 / 102` et le bouton `Ouvrir le PDF` visibles dans la barre d'outils), mais reste bloqué sur l'écran **« Chargement du document... »**.

### Pourquoi le blocage se produit
1. **Absence d'événement `onLoad` et de moteur PDF en `<iframe>` sur mobile** : Sur les navigateurs mobiles (notamment Chrome sur Android visible sur la capture) ainsi que certains navigateurs desktop, un élément `<iframe src="blob:...">` pointant vers un flux `application/pdf` ne déclenche pas l'événement `onLoad` ou ne possède pas de greffon PDF intégré.
2. **Superposition permanente du masque de chargement** : Dans `PdfViewer.tsx`, la condition `(status === 'ready' && !frameLoaded)` maintient le calque `.publication-pdf__message` (`position: absolute; inset: 0; z-index: 1`) par-dessus le document tant que `frameLoaded` reste `false`, ce qui bloque indéfiniment la vue sur *« Chargement du document... »*.

---

### 1. Vue d'ensemble de la solution

- **Rendu direct des pages PDF sur `<canvas>` (via `pdfjs-dist`)** :
  - Au lieu de dépendre d'un `<iframe>` natif qui échoue sur mobile, le lecteur décode les octets du PDF déjà téléchargés (`blob.arrayBuffer()`) et dessine directement la page courante (`Page 1 / 102`, `Page 2 / 102`, etc.) en haute résolution (adaptée au `devicePixelRatio` de l'écran) dans la zone `.publication-pdf__stage`.
  - Les boutons de pagination (`‹`, `›`) et de zoom (`−`, `100%`, `+`) pilotent directement le rendu de la page correspondante sur mobile comme sur ordinateur.
- **Suppression du blocage infini (`!frameLoaded`)** :
  - Dès que le PDF est téléchargé et que la page est rendue (ou en repli `<object>`/`<iframe>` avec délai de sécurité maximal de 800 ms si nécessaire), l'indicateur *« Chargement du document... »* disparaît immédiatement.
- **Bouton « Ouvrir le PDF » corrigé** :
  - Le bouton `Ouvrir le PDF` ouvre le document dans le lecteur natif de l'appareil (`target="_blank"`) en complément de la lecture directe intégrée dans la page.

---

### 2. Architecture technique

```
┌───────────────────────────────────────────────────────────────────┐
│                    SinglePublicationPage                          │
│  /api/documents/publication/:id ──► DocumentDTO (id, pageCount)   │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                          PdfViewer                                │
│  1. documentsService.getDocumentBlob(documentId)                  │
│  2. Décodage ArrayBuffer via PDF.js (pdfjs-dist)                  │
│  3. Rendu haute définition de la page `pageNumber` au `zoom` %    │
│     sur <canvas> (compatible 100 % Android / iOS / Desktop)       │
│  4. Repli immédiat sans masque bloquant si erreur de rendu        │
└───────────────────────────────────────────────────────────────────┘
```
