# Guide de Déploiement en Production sur AWS EC2 (Sans Docker)
## Plateforme Académique Galileo — Faculté Polytechnique, Université Mapon

Ce document fournit la procédure complète, éprouvée et sécurisée pour déployer l'architecture Galileo v3.0 sur une instance **AWS EC2 sous Ubuntu 24.04 LTS**, sans conteneurisation Docker ni Docker Compose, conformément aux directives d'infrastructure.

---

## 1. Architecture Cible

```
                      Internet (HTTPS 443)
                              │
                              ▼
                ┌───────────────────────────┐
                │       Nginx Reverse       │
                │     Proxy (Port 80/443)   │
                └──────┬─────────────┬──────┘
                       │             │
        /api/* et /actuator          │ Fichiers statiques SPA (/)
                       ▼             ▼
       ┌───────────────────────┐   ┌───────────────────────┐
       │ Spring Boot 3.3.4     │   │ React 19 + Vite Dist  │
       │ (Port interne 8080)   │   │ /var/www/galileo/html │
       │ Service Systemd       │   └───────────────────────┘
       └───────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌──────────────────┐  ┌───────────────────────────────────┐
│ PostgreSQL 16    │  │ Services Cloud Externes           │
│ + pgvector 1024  │  │ - Cloudflare R2 (Stockage PDF/S3) │
│ (Port 5432 local)│  │ - API DeepSeek (Assistance RAG)   │
└──────────────────┘  │ - API Qwen (Embeddings 1024 dims) │
                      └───────────────────────────────────┘
```

---

## 2. Prérequis Système et Logiciels

- **Instance EC2** : `t3.medium` ou `t3.large` recommandé (minimum 2 vCPU, 4 Go RAM).
- **Système d'exploitation** : Ubuntu 24.04 LTS (Noble Numbat).
- **Nom de domaine** : Un enregistrement DNS de type `A` pointant vers l'IP élastique de l'instance EC2 (ex: `galileo.mapon.ac.cd`).

### 2.1 Mise à jour initiale du système
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip gnupg ufw certbot python3-certbot-nginx
```

### 2.2 Installation de Java 21 (Eclipse Temurin)
```bash
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg
echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-21-jdk
java -version
```

### 2.3 Installation de PostgreSQL 16 et pgvector
```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16 postgresql-16-pgvector
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2.4 Installation de Node.js 20 LTS (pour le build frontend)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 2.5 Installation de Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 3. Sécurité Réseau et Pare-feu (UFW)

Seuls les flux d'administration SSH et web public (HTTP/HTTPS) doivent être ouverts. **La base de données PostgreSQL (5432) et le backend Spring Boot (8080) ne doivent JAMAIS être exposés directement à Internet.**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH Administration'
sudo ufw allow 80/tcp comment 'HTTP Nginx'
sudo ufw allow 443/tcp comment 'HTTPS Nginx'
sudo ufw enable
sudo ufw status verbose
```

---

## 4. Utilisateur Système Dédié

Pour respecter le principe de moindre privilège, l'application s'exécute sous un compte système dédié sans privilèges `sudo` ni shell interactif :

```bash
sudo useradd -r -s /bin/false -d /opt/galileo galileo
sudo mkdir -p /opt/galileo /var/log/galileo /etc/galileo /var/www/galileo
sudo chown -R galileo:galileo /opt/galileo /var/log/galileo /etc/galileo
```

---

## 5. Configuration de PostgreSQL et pgvector

Connectez-vous au serveur PostgreSQL local pour créer la base et activer l'extension vectorielle :

```bash
sudo -u postgres psql
```

Exécutez les requêtes SQL suivantes :
```sql
CREATE DATABASE galileo;
CREATE USER galileo_user WITH ENCRYPTED PASSWORD 'DEFINIR_UN_MOT_DE_PASSE_TRES_FORT_ICI';
GRANT ALL PRIVILEGES ON DATABASE galileo TO galileo_user;

\c galileo
CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL ON SCHEMA public TO galileo_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO galileo_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO galileo_user;
\q
```

*Note : Les migrations Flyway (V1 et V2) s'exécuteront automatiquement au premier démarrage de Spring Boot pour initialiser l'ensemble des 36 tables, des index et des données de référence.*

---

## 6. Variables d'Environnement et Secrets

Toutes les variables sensibles sont stockées dans `/etc/galileo/galileo.env`, avec des permissions strictement limitées à `600` (lecture seule pour root et le service systemd).

### 6.1 Génération d'un secret JWT cryptographique (256 bits)
Ne jamais utiliser de secret par défaut en production. Générez une clé aléatoire forte :
```bash
openssl rand -hex 32
```

### 6.2 Création du fichier `/etc/galileo/galileo.env`
```bash
sudo tee /etc/galileo/galileo.env > /dev/null << 'EOF'
# ─── BASE DE DONNÉES ───
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/galileo
SPRING_DATASOURCE_USERNAME=galileo_user
SPRING_DATASOURCE_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES_FORT

# ─── SERVEUR & SÉCURITÉ ───
PORT=8080
JWT_SECRET=COLLEZ_ICI_LA_CLE_HEX_32_GENEREE
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000
CORS_ALLOWED_ORIGINS=https://galileo.mapon.ac.cd,https://www.galileo.mapon.ac.cd

# ─── STOCKAGE CLOUDFLARE R2 ───
STORAGE_TYPE=r2
R2_ACCOUNT_ID=VOTRE_CLOUDFLARE_R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=VOTRE_R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=VOTRE_R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME=galileo-documents
R2_PUBLIC_URL=https://documents.galileo.mapon.ac.cd

# ─── INTELLIGENCE ARTIFICIELLE ───
DEEPSEEK_API_KEY=sk-VOTRE_CLE_DEEPSEEK
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

QWEN_API_KEY=sk-VOTRE_CLE_QWEN_DASHSCOPE
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
EOF

sudo chmod 600 /etc/galileo/galileo.env
sudo chown galileo:galileo /etc/galileo/galileo.env
```

---

## 7. Compilation et Déploiement des Fichiers

### 7.1 Compilation du Backend
Sur la machine de build (ou directement sur l'instance) :
```bash
cd backend
./mvnw clean package -DskipTests
sudo cp target/galileo-3.0.0.jar /opt/galileo/galileo.jar
sudo chown galileo:galileo /opt/galileo/galileo.jar
```

### 7.2 Compilation du Frontend React
```bash
cd ../
npm ci
VITE_API_URL=/api npm run build
sudo rm -rf /var/www/galileo/frontend
sudo cp -r dist /var/www/galileo/frontend
sudo chown -R www-data:www-data /var/www/galileo/frontend
```

---

## 8. Configuration Systemd (Service Backend)

Créez le fichier de service `/etc/systemd/system/galileo.service` :

```ini
[Unit]
Description=Galileo Academic Backend (Spring Boot)
After=syslog.target network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=galileo
Group=galileo
WorkingDirectory=/opt/galileo
EnvironmentFile=/etc/galileo/galileo.env
ExecStart=/usr/bin/java -Xms512m -Xmx2048m -XX:+UseG1GC -jar /opt/galileo/galileo.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

# Durcissement système (Security Hardening)
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

StandardOutput=journal
StandardError=journal
SyslogIdentifier=galileo

[Install]
WantedBy=multi-user.target
```

Activez et démarrez le service :
```bash
sudo systemctl daemon-reload
sudo systemctl enable galileo
sudo systemctl start galileo
sudo systemctl status galileo
```

---

## 9. Configuration Nginx et Reverse Proxy

Créez `/etc/nginx/sites-available/galileo` :

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name galileo.mapon.ac.cd;

    # Taille max upload documents académiques
    client_max_body_size 50M;

    # Frontend React (SPA)
    root /var/www/galileo/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend Spring Boot
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
    }

    # Actuator Health Check (Supervision)
    location /actuator/health {
        proxy_pass http://127.0.0.1:8080/actuator/health;
        proxy_set_header Host $host;
    }

    # Cache des ressources statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

Activez le site et rechargez Nginx :
```bash
sudo ln -sf /etc/nginx/sites-available/galileo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. Activation du HTTPS avec Let's Encrypt (Certbot)

```bash
sudo certbot --nginx -d galileo.mapon.ac.cd --non-interactive --agree-tos -m admin@universitemapon.ac.cd --redirect
```

Vérifiez le renouvellement automatique :
```bash
sudo certbot renew --dry-run
```

---

## 11. Supervision, Logs et Diagnostic

### 11.1 Logs en temps réel
```bash
# Logs Spring Boot
sudo journalctl -u galileo -f

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 11.2 Health Check Actuator
```bash
curl -i https://galileo.mapon.ac.cd/actuator/health
# Réponse attendue : HTTP 200 {"status":"UP"}
```

---

## 12. Sauvegardes, Rétention et Restauration

### 12.1 Script de Sauvegarde PostgreSQL Quotidienne
Créez `/opt/galileo/scripts/backup.sh` :
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/galileo"
DATE=$(date +'%Y%m%d_%H%M%S')
mkdir -p "$BACKUP_DIR"
pg_dump -U galileo_user -h localhost galileo | gzip > "$BACKUP_DIR/galileo_db_$DATE.sql.gz"
# Rétention 30 jours
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
```
Rendre exécutable et ajouter dans le crontab de l'utilisateur `postgres` à 02h00 chaque nuit :
```bash
sudo chmod +x /opt/galileo/scripts/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/galileo/scripts/backup.sh") | crontab -
```

### 12.2 Procédure de Restauration
```bash
gunzip < /var/backups/galileo/galileo_db_DATE.sql.gz | psql -U galileo_user -h localhost -d galileo
```

---

## 13. Procédure de Retour Arrière (Rollback)

En cas d'anomalie après déploiement :
1. **Restaurer la version précédente du JAR** :
   ```bash
   sudo cp /opt/galileo/galileo.jar.backup /opt/galileo/galileo.jar
   sudo systemctl restart galileo
   ```
2. **Restaurer la version précédente du frontend** :
   ```bash
   sudo cp -r /var/www/galileo/frontend.backup /var/www/galileo/frontend
   sudo systemctl reload nginx
   ```
3. Vérifier le retour à l'état nominal via `/actuator/health`.
