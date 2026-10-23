# Galileo v3.0 — Plateforme Académique et Scientifique

Plateforme web de recherche, d'archivage et de publication académique destinée aux étudiants, chercheurs et enseignants de la **Faculté Polytechnique de l'Université Mapon**.

Galileo permet le dépôt, la revue par les pairs, la validation éditoriale, l'indexation plein texte et vectorielle (IA), ainsi que la consultation en libre accès des mémoires, thèses, rapports et publications de recherche.

---

## 🏛️ Architecture Technique

| Composant | Technologie | Description |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS | Interface réactive SPA, typage strict, routage par rôles |
| **Backend** | Java 21, Spring Boot 3.3.4, Spring Security 6, Maven | API REST unifiée, authentification JWT stateless, validation |
| **Base de données** | PostgreSQL 16+ avec extension `pgvector` | Schéma relationnel (36 tables), vecteurs 1024 dimensions, Flyway |
| **Stockage Fichiers** | Cloudflare R2 (compatible S3) / Fallback local | Archivage sécurisé des PDFs avec contrôle MIME et taille |
| **IA & Sémantique** | Qwen `text-embedding-v4` & DeepSeek Chat | Recherche par similarité cosinus (pgvector) et assistant de synthèse |
| **Déploiement** | Ubuntu 24.04 LTS sur AWS EC2 | Service `systemd` natif + reverse proxy `Nginx` (sans Docker) |

---

## 🔐 Variables d'Environnement

Pour la production, toutes les valeurs sensibles doivent être configurées via des variables d'environnement (ou dans un fichier protégé `/etc/galileo/galileo.env`).

| Variable | Obligatoire en Prod | Description / Valeur par défaut |
|---|---|---|
| `SPRING_DATASOURCE_URL` | **Oui** | `jdbc:postgresql://localhost:5432/galileodb` |
| `SPRING_DATASOURCE_USERNAME` | **Oui** | Utilisateur PostgreSQL de production |
| `SPRING_DATASOURCE_PASSWORD` | **Oui** | Mot de passe fort de la base de données |
| `JWT_SECRET` | **Oui** | Clé secrète HMAC-SHA256 (>= 256 bits, 64 caractères aléatoires) |
| `JWT_EXPIRATION_MS` | Non | Durée du token d'accès en ms (`86400000` = 24h par défaut) |
| `JWT_REFRESH_EXPIRATION_MS` | Non | Durée du refresh token en ms (`604800000` = 7 jours) |
| `STORAGE_TYPE` | Non | `r2` pour Cloudflare R2, ou `local` pour stockage sur disque |
| `STORAGE_LOCAL_DIR` | Non | Répertoire des uploads locaux si `STORAGE_TYPE=local` (`uploads`) |
| `R2_ACCOUNT_ID` | Si R2 actif | Identifiant du compte Cloudflare |
| `R2_ACCESS_KEY_ID` | Si R2 actif | Clé d'accès API S3 Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Si R2 actif | Clé secrète S3 Cloudflare R2 |
| `R2_BUCKET_NAME` | Si R2 actif | Nom du bucket (`galileo-documents`) |
| `R2_PUBLIC_URL` | Si R2 actif | URL publique personnalisée du bucket R2 |
| `DEEPSEEK_API_KEY` | Si IA active | Clé API DeepSeek pour l'assistant documentaire |
| `DEEPSEEK_BASE_URL` | Non | `https://api.deepseek.com/v1` |
| `QWEN_API_KEY` | Si IA active | Clé API DashScope Qwen pour les embeddings 1024-dim |

---

## 🚀 Développement Local

### Prérequis
- Java 21 LTS (OpenJDK ou Eclipse Temurin)
- Node.js 20+ et npm
- PostgreSQL 16+ avec `pgvector` activé

### 1. Démarrer le Frontend
```bash
npm install
npm run typecheck    # Vérification stricte TypeScript (0 erreur)
npm run dev          # Lance le serveur Vite sur http://localhost:5173
```

### 2. Démarrer le Backend
```bash
cd backend
./mvnw clean test    # Exécution des tests unitaires et d'intégration
./mvnw spring-boot:run
```
L'API REST est exposée sur `http://localhost:8080/api`.

---

## 🌐 Guide de Déploiement en Production (AWS EC2 Ubuntu 24.04 sans Docker)

Ce guide décrit l'installation standard, sécurisée et reproductible directement sous **systemd** et **Nginx**.

### 1. Préparation du Système et Dépendances
Connectez-vous à votre instance EC2 :
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-21-jdk nodejs npm postgresql postgresql-contrib nginx git
```

Installer l'extension `pgvector` pour PostgreSQL :
```bash
sudo apt install -y postgresql-server-dev-16 build-essential
cd /tmp
git clone --branch v0.7.0 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### 2. Configuration de PostgreSQL
Créer la base de données et activer pgvector :
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE galileodb;
CREATE USER galileo_app WITH ENCRYPTED PASSWORD 'VOTRE_MOT_DE_PASSE_TRES_FORT';
GRANT ALL PRIVILEGES ON DATABASE galileodb TO galileo_app;
\c galileodb
CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL ON SCHEMA public TO galileo_app;
\q
```

### 3. Fichier d'Environnement Sécurisé
Créer le fichier `/etc/galileo/galileo.env` (accessible uniquement par l'utilisateur système) :
```bash
sudo mkdir -p /etc/galileo
sudo nano /etc/galileo/galileo.env
```

Y insérer vos configurations de production :
```ini
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/galileodb
SPRING_DATASOURCE_USERNAME=galileo_app
SPRING_DATASOURCE_PASSWORD=VOTRE_MOT_DE_PASSE_TRES_FORT
JWT_SECRET=GENERER_UNE_CLE_ALEATOIRE_DE_64_CARACTERES_MINIMUM
STORAGE_TYPE=r2
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key
R2_SECRET_ACCESS_KEY=votre_secret_key
R2_BUCKET_NAME=galileo-documents
DEEPSEEK_API_KEY=votre_cle_deepseek
QWEN_API_KEY=votre_cle_qwen
```

Verrouiller les permissions :
```bash
sudo chmod 600 /etc/galileo/galileo.env
```

### 4. Build du Projet
Sur la machine de déploiement (ou via votre pipeline CI/CD) :
```bash
# Frontend
npm ci
npm run build
# Les assets statiques sont générés dans ./dist

# Backend
cd backend
./mvnw clean package -DskipTests
# Le JAR est généré dans backend/target/galileo-3.0.0.jar
```

Déplacer les fichiers aux emplacements prévus :
```bash
sudo mkdir -p /var/www/galileo
sudo cp -r dist/* /var/www/galileo/

sudo mkdir -p /opt/galileo
sudo cp backend/target/galileo-3.0.0.jar /opt/galileo/galileo.jar
```

### 5. Service systemd pour Spring Boot
Créer le fichier `/etc/systemd/system/galileo.service` :
```ini
[Unit]
Description=Galileo Academic Platform Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
EnvironmentFile=/etc/galileo/galileo.env
ExecStart=/usr/bin/java -Xms512m -Xmx1536m -jar /opt/galileo/galileo.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
```

Activer et démarrer le service :
```bash
sudo systemctl daemon-reload
sudo systemctl enable galileo
sudo systemctl start galileo
sudo systemctl status galileo
```

### 6. Configuration Nginx (Reverse Proxy + SPA)
Créer le fichier `/etc/nginx/sites-available/galileo` :
```nginx
server {
    listen 80;
    server_name galileo.univ-mapon.cd; # Ou adresse IP publique de l'EC2

    # Racine du frontend React
    root /var/www/galileo;
    index index.html;

    client_max_body_size 50M;

    # Routage SPA React (redirige vers index.html pour le routing client)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API REST vers Spring Boot
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Protection des endpoints d'administration et actuator
    location /actuator/ {
        deny all;
        return 404;
    }
}
```

Activer le site et recharger Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/galileo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Maintenance et Surveillance
- **Consulter les journaux du backend :**
  ```bash
  journalctl -u galileo -f -n 100
  ```
- **Consulter les journaux Nginx :**
  ```bash
  tail -f /var/log/nginx/access.log
  tail -f /var/log/nginx/error.log
  ```
- **Sauvegarde quotidienne de la base de données :**
  ```bash
  pg_dump -U galileo_app -h localhost galileodb | gzip > /opt/backups/galileodb_$(date +%Y%m%d).sql.gz
  ```
- **Redémarrer le backend :**
  ```bash
  sudo systemctl restart galileo
  ```

---

## 🛡️ Règles de Sécurité Appliquées

1. **Rôles et Inscription Publique :** Toute inscription via `/api/auth/register` attribue strictement le rôle `STUDENT`. L'attribution des rôles privilégiés (`STAFF`, `ADMIN`, `TEACHER`, `RESEARCHER`) est strictement réservée à l'API protégée `/api/admin/users/{id}/role` accessible uniquement aux administrateurs.
2. **Protection Actuator :** Les endpoints de métriques et de diagnostic internes sont restreints à `health` et `info`.
3. **Téléversement sécurisé :** Validation de taille (50 Mo max) et vérification du type de contenu des documents PDF avant persistance sur R2 ou sur disque.
4. **Pas de secrets codés en dur :** Tous les identifiants sensibles proviennent de l'environnement d'exécution.
