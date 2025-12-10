# PLAN D'IMPLÉMENTATION BACKEND : JAVA SPRING BOOT & FIREBASE

## 1. ANALYSE DE VOTRE CHOIX TECHNIQUE

Vous avez parfaitement raison de remettre en question l'architecture monolithique Node.js si votre vision est le **long terme** et la **robustesse institutionnelle**.

*   **Java (Spring Boot) :** C'est le standard de l'industrie pour les systèmes critiques. Le typage fort, l'injection de dépendances et l'écosystème mature garantissent une maintenabilité supérieure sur 5 ou 10 ans par rapport à un écosystème JS qui évolue (et casse) très vite.
*   **Firebase Auth :** Excellente décision stratégique. Gérer l'authentification soi-même (mots de passe, sessions, sécurité) est risqué et chronophage. Déléguer cela à Google (Firebase) vous libère d'une dette technique massive et sécurise vos utilisateurs dès le jour 1.

**Verdict :** Ce duo (Spring Boot + Firebase) offre une architecture **"Enterprise-Grade"**. Ce n'est pas juste un site web, c'est un système d'information.

---

## 2. ARCHITECTURE PROPOSÉE : "CLEAN ARCHITECTURE" (MODULAIRE)

Pour éviter le piège du "monolithe spaghetti", nous allons adopter une **Architecture Hexagonale (ou en Oignon)**. L'idée est d'isoler le cœur métier (les règles de gestion de la revue) des détails techniques (Base de données, API, Fichiers).

### La Stack Technique
*   **Langage :** Java 21 (Dernière version LTS - Long Term Support).
*   **Framework :** Spring Boot 3.2+.
*   **Base de Données :** PostgreSQL.
*   **Sécurité :** Spring Security + Firebase Admin SDK.
*   **Build Tool :** Maven (plus verbeux mais plus stable et standard que Gradle pour ce type de projet).

---

## 3. LES GRANDS COMPOSANTS (SERVICES) À IMPLÉMENTER

Voici le découpage des services métiers. Notez que **toutes les variables et classes seront nommées en Français** comme demandé, pour une clarté totale au sein de l'équipe francophone.

### A. Service : `GestionSecurite` (La Porte d'Entrée)
Ce n'est pas un service métier, mais une couche d'infrastructure vitale.
*   **Rôle :** Intercepter chaque requête HTTP.
*   **Fonctionnement :**
    1.  Le Frontend envoie un token : `Authorization: Bearer <TOKEN_FIREBASE>`.
    2.  Le backend vérifie ce token via `FirebaseAdmin`.
    3.  Si valide, il extrait l'email et le rôle (Admin/Étudiant).
    4.  Il crée un contexte de sécurité Spring (`SecurityContext`).
*   **Variables Clés :** `jetonAuthentification`, `utilisateurConnecte`, `droitsAcces`.

### B. Service : `ServicePublications` (Le Cœur du Réacteur)
Gère le cycle de vie des articles scientifiques.
*   **Fonctionnalités :**
    *   `creerPublication(Publication nouvellePublication)`
    *   `validerPublication(Long idPublication)`
    *   `rechercherParDomaine(String domaine)`
*   **Entité `Publication` (Modèle de données) :**
    ```java
    @Entity
    public class Publication {
        @Id @GeneratedValue
        private Long id;
        
        private String titreFrancais;
        private String titreAnglais;
        
        @Column(columnDefinition = "TEXT")
        private String resumeFrancais;
        
        @Column(columnDefinition = "TEXT")
        private String resumeAnglais;
        
        private LocalDate datePublication;
        private String urlFichierPdf;    // Lien vers le stockage
        private String urlImageCouverture;
        
        private String domaine;          // Ex: "Génie Civil"
        private int nombreVues;
        private int nombreTelechargements;
        
        @ManyToMany
        private List<Auteur> auteurs;
    }
    ```

### C. Service : `ServiceSoumissions` (Le Workflow Étudiant)
Gère le processus de dépôt par les étudiants avant que cela ne devienne une publication officielle.
*   **Workflow :** `BROUILLON` -> `EN_REVISION` -> `ACCEPTE` -> `PUBLIE` ou `REFUSE`.
*   **Variables Clés :** `statutSoumission`, `emailContactEtudiant`, `fichierManuscrit`.
*   **Logique Métier :**
    *   Vérifier que le fichier est bien un PDF.
    *   Notifier les administrateurs par email lors d'une nouvelle soumission.

### D. Service : `ServiceEvenements` & `ServiceBlog`
Modules de gestion de contenu (CMS) pour l'animation du site.
*   **Entité `Evenement` :**
    *   `dateDebut`, `dateFin`, `lieu`, `typeEvenement` (Atelier, Conférence).
    *   `listeOrateurs` (Relation One-To-Many).

### E. Service : `ServiceStockage` (Infrastructure)
Une abstraction pour ne pas dépendre directement d'Amazon S3 ou du disque dur local.
*   **Interface :**
    ```java
    public interface ServiceStockage {
        String sauvegarderFichier(MultipartFile fichier, String dossierDestination);
        void supprimerFichier(String urlFichier);
        byte[] telechargerFichier(String urlFichier);
    }
    ```
*   Cela permet de changer de fournisseur de cloud demain sans toucher au code métier.

---

## 4. PLAN D'IMPLÉMENTATION DÉTAILLÉ (ROADMAP)

### Étape 1 : Initialisation du Socle (Jours 1-2)
1.  Générer le projet via **Spring Initializr** (Web, JPA, Postgres, Security, Lombok).
2.  Configurer `application.properties` pour la connexion PostgreSQL.
3.  Configurer **Firebase Admin SDK** (ajouter le fichier `service-account.json` sécurisé).

### Étape 2 : Sécurisation de l'API (Jours 3-4)
1.  Créer une classe `FiltreAuthentificationFirebase` qui étend `OncePerRequestFilter`.
2.  Implémenter la logique de validation du token JWT.
3.  Configurer `SecurityFilterChain` pour protéger les routes `/api/admin/**` et laisser public `/api/public/**`.

### Étape 3 : Modélisation & Base de Données (Jours 5-6)
1.  Créer les entités JPA (`Publication`, `Auteur`, `Evenement`, `Soumission`) avec des noms en français.
2.  Lancer l'application pour qu'Hibernate génère les tables SQL automatiquement (ou utiliser Flyway pour des migrations propres).

### Étape 4 : Développement des Services Métiers (Jours 7-10)
1.  Implémenter `ServicePublications` : CRUD complet.
2.  Implémenter la logique de recherche (filtrage par domaine, année).
3.  Implémenter `ServiceSoumissions` : Logique de changement d'état (Machine à états).

### Étape 5 : Contrôleurs REST (API) (Jours 11-12)
1.  Exposer les endpoints :
    *   `GET /api/public/publications`
    *   `POST /api/soumissions` (Ouvert aux étudiants authentifiés)
    *   `POST /api/admin/publications` (Réservé aux admins)
2.  Utiliser des **DTO (Data Transfer Objects)** pour ne pas exposer directement les entités de la base de données (ex: `PublicationDTO`, `FormulaireSoumissionDTO`).

### Étape 6 : Tests & Déploiement (Jours 13-15)
1.  Écrire des tests unitaires (JUnit 5) pour les services critiques.
2.  Configurer un Dockerfile pour conteneuriser l'application Java.

---

## 5. EXEMPLE DE CODE (STYLE FRANÇAIS)

Voici à quoi ressemblera un contrôleur typique dans votre projet :

```java
@RestController
@RequestMapping("/api/v1/publications")
public class ControleurPublications {

    private final ServicePublications servicePublications;

    public ControleurPublications(ServicePublications servicePublications) {
        this.servicePublications = servicePublications;
    }

    @GetMapping
    public ResponseEntity<List<PublicationDTO>> listerToutesLesPublications(
            @RequestParam(required = false) String domaine) {
        
        List<PublicationDTO> resultats = servicePublications.rechercherParDomaine(domaine);
        return ResponseEntity.ok(resultats);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Sécurité Spring + Firebase
    public ResponseEntity<PublicationDTO> publierArticle(
            @RequestBody FormulaireCreationArticle formulaire) {
            
        PublicationDTO nouvellePub = servicePublications.creerPublication(formulaire);
        return ResponseEntity.status(HttpStatus.CREATED).body(nouvellePub);
    }
}
```

Ce plan vous assure une structure **évolutive**, **sécurisée** et **compréhensible** par votre équipe francophone.
