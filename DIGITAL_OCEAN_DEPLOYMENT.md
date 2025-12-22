# 🚀 Guide de Déploiement sur Digital Ocean - Projet Galileo

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Étape 1 : Créer un Droplet Digital Ocean](#étape-1--créer-un-droplet-digital-ocean)
3. [Étape 2 : Configurer le Droplet](#étape-2--configurer-le-droplet)
4. [Étape 3 : Installer Docker et Docker Compose](#étape-3--installer-docker-et-docker-compose)
5. [Étape 4 : Configurer le domaine et DNS](#étape-4--configurer-le-domaine-et-dns)
6. [Étape 5 : Préparer l'application](#étape-5--préparer-lapplication)
7. [Étape 6 : Configurer les variables d'environnement](#étape-6--configurer-les-variables-denvironnement)
8. [Étape 7 : Configurer SSL avec Let's Encrypt](#étape-7--configurer-ssl-avec-lets-encrypt)
9. [Étape 8 : Déployer l'application](#étape-8--déployer-lapplication)
10. [Étape 9 : Configurer les sauvegardes](#étape-9--configurer-les-sauvegardes)
11. [Étape 10 : Surveillance et maintenance](#étape-10--surveillance-et-maintenance)
12. [Sécurité](#sécurité)
13. [Dépannage](#dépannage)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte [Digital Ocean](https://www.digitalocean.com/)
- ✅ Un nom de domaine (ex: galileo.votredomaine.com)
- ✅ Un compte Firebase configuré
- ✅ Un compte Cloudflare R2 pour le stockage
- ✅ Un compte SendGrid pour les emails
- ✅ Git installé sur votre machine locale
- ✅ Connaissance de base de SSH et Linux

**Budget estimé** : 12-24 USD/mois (Droplet Basic de 2 Go RAM minimum)

---

## Étape 1 : Créer un Droplet Digital Ocean

### 1.1 Connexion à Digital Ocean

1. Connectez-vous à [Digital Ocean](https://cloud.digitalocean.com/)
2. Cliquez sur **Create** → **Droplets**

### 1.2 Configuration du Droplet

**Choisir une image :**
```
Distribution: Ubuntu 22.04 LTS x64
```

**Choisir un plan :**
```
Plan recommandé minimum :
- Basic Plan
- Regular CPU
- 4 GB RAM / 2 vCPUs
- 80 GB SSD Disk
- 4 TB Transfer
Prix : ~24 USD/mois
```

> 💡 **Note** : Pour un environnement de test, vous pouvez commencer avec 2 GB RAM (~12 USD/mois) mais cela peut être limite avec Elasticsearch.

**Choisir une région :**
```
Choisissez la région la plus proche de vos utilisateurs
Exemple : Frankfurt (FRA1) pour l'Europe
```

**Authentification :**
```
Méthode recommandée : Clé SSH
- Cliquez sur "New SSH Key"
- Collez votre clé SSH publique (voir ci-dessous pour générer une clé)
- Donnez-lui un nom (ex: "mon-ordinateur")
```

**Générer une clé SSH (si vous n'en avez pas) :**
```bash
# Sur votre machine locale (Linux/Mac)
ssh-keygen -t ed25519 -C "votre-email@example.com"

# Afficher la clé publique
cat ~/.ssh/id_ed25519.pub

# Copiez le contenu et collez-le dans Digital Ocean
```

**Options supplémentaires :**
```
Hostname : galileo-production
Tags : production, galileo
Monitoring : ✅ Activé (gratuit)
IPv6 : ✅ Activé (recommandé)
```

### 1.3 Créer le Droplet

1. Cliquez sur **Create Droplet**
2. Attendez 1-2 minutes que le Droplet soit créé
3. Notez l'adresse IP publique (ex: `157.230.X.X`)

---

## Étape 2 : Configurer le Droplet

### 2.1 Se connecter au Droplet

```bash
# Sur votre machine locale
ssh root@VOTRE_IP_DROPLET

# Exemple
ssh root@157.230.X.X
```

### 2.2 Mettre à jour le système

```bash
# Mettre à jour les packages
apt update && apt upgrade -y

# Installer les outils essentiels
apt install -y curl wget git vim ufw fail2ban htop
```

### 2.3 Créer un utilisateur non-root

```bash
# Créer un nouvel utilisateur
adduser galileo

# Ajouter au groupe sudo
usermod -aG sudo galileo

# Copier la configuration SSH
rsync --archive --chown=galileo:galileo ~/.ssh /home/galileo
```

### 2.4 Configurer le pare-feu (UFW)

```bash
# Autoriser SSH
ufw allow OpenSSH

# Autoriser HTTP et HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le pare-feu
ufw enable

# Vérifier le status
ufw status
```

**Résultat attendu :**
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 2.5 Configurer Fail2Ban (protection contre les attaques)

```bash
# Copier la configuration par défaut
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Éditer la configuration
nano /etc/fail2ban/jail.local
```

Modifiez les paramètres suivants :
```ini
[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 3600
```

```bash
# Redémarrer Fail2Ban
systemctl restart fail2ban

# Vérifier le status
systemctl status fail2ban
```

### 2.6 Se connecter avec le nouvel utilisateur

```bash
# Quitter la session root
exit

# Se reconnecter avec le nouvel utilisateur
ssh galileo@VOTRE_IP_DROPLET
```

---

## Étape 3 : Installer Docker et Docker Compose

### 3.1 Installer Docker

```bash
# Installer les prérequis
sudo apt install -y ca-certificates curl gnupg lsb-release

# Ajouter la clé GPG officielle de Docker
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Ajouter le repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Vérifier l'installation
sudo docker --version
sudo docker compose version
```

**Résultat attendu :**
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### 3.2 Configurer Docker pour l'utilisateur

```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Appliquer les changements (se reconnecter)
newgrp docker

# Tester sans sudo
docker ps
```

### 3.3 Configurer Docker pour démarrer automatiquement

```bash
# Activer Docker au démarrage
sudo systemctl enable docker

# Démarrer Docker
sudo systemctl start docker

# Vérifier le status
sudo systemctl status docker
```

---

## Étape 4 : Configurer le domaine et DNS

### 4.1 Obtenir l'IP du Droplet

```bash
# Afficher l'IP publique
curl -4 ifconfig.me
```

### 4.2 Configurer les enregistrements DNS

Connectez-vous à votre registrar de domaine (ex: Namecheap, GoDaddy, Cloudflare) et ajoutez ces enregistrements DNS :

```
Type    Nom              Valeur                TTL
----    ----             ------                ---
A       galileo          VOTRE_IP_DROPLET      3600
A       www.galileo      VOTRE_IP_DROPLET      3600
AAAA    galileo          VOTRE_IPV6_DROPLET    3600 (optionnel)
AAAA    www.galileo      VOTRE_IPV6_DROPLET    3600 (optionnel)
```

**Exemple concret :**
```
A       galileo.exemple.com          157.230.X.X       3600
A       www.galileo.exemple.com      157.230.X.X       3600
```

### 4.3 Vérifier la propagation DNS

```bash
# Attendre 5-10 minutes pour la propagation DNS

# Vérifier la résolution DNS
nslookup galileo.votredomaine.com

# Tester la connectivité
ping galileo.votredomaine.com
```

---

## Étape 5 : Préparer l'application

### 5.1 Cloner le repository

```bash
# Se placer dans le dossier home
cd ~

# Cloner le projet
git clone https://github.com/Florentin-artemix/Galileo.git

# Entrer dans le dossier
cd Galileo

# Vérifier la structure
ls -la
```

### 5.2 Créer la structure des dossiers

```bash
# Créer les dossiers pour les données persistantes
mkdir -p ~/galileo-data/postgres-lecture
mkdir -p ~/galileo-data/postgres-ecriture
mkdir -p ~/galileo-data/elasticsearch
mkdir -p ~/galileo-data/backups
mkdir -p ~/galileo-data/logs

# Créer le dossier pour les configurations
mkdir -p ~/Galileo/backend/galileo-gateway/config

# Définir les permissions
chmod -R 755 ~/galileo-data
```

---

## Étape 6 : Configurer les variables d'environnement

### 6.1 Configurer Firebase

**Sur votre machine locale :**

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Project Settings** → **Service Accounts**
4. Cliquez sur **Generate New Private Key**
5. Téléchargez le fichier JSON

**Transférer le fichier vers le serveur :**

```bash
# Sur votre machine locale
scp /chemin/vers/firebase-credentials.json galileo@VOTRE_IP_DROPLET:~/Galileo/backend/galileo-gateway/config/

# Ou utilisez un outil comme FileZilla, WinSCP
```

### 6.2 Créer le fichier .env

```bash
# Sur le serveur
cd ~/Galileo
cp .env.example .env
nano .env
```

**Modifiez les valeurs suivantes dans le fichier .env :**

```bash
# ==========================================
# FRONTEND - React Application
# ==========================================
VITE_API_URL=https://galileo.votredomaine.com/api

# ==========================================
# FIREBASE - Authentication (Frontend)
# ==========================================
VITE_FIREBASE_API_KEY=votre-api-key-firebase
VITE_FIREBASE_AUTH_DOMAIN=votre-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-project-id
VITE_FIREBASE_STORAGE_BUCKET=votre-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre-sender-id
VITE_FIREBASE_APP_ID=votre-app-id

# ==========================================
# FIREBASE - Authentication (Backend)
# ==========================================
GOOGLE_APPLICATION_CREDENTIALS=config/firebase-credentials.json
FIREBASE_PROJECT_ID=votre-project-id

# ==========================================
# CLOUDFLARE R2 - Storage
# ==========================================
CLOUDFLARE_R2_ENDPOINT=https://votre-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY=votre_access_key
CLOUDFLARE_R2_SECRET_KEY=votre_secret_key
CLOUDFLARE_R2_BUCKET_NAME=galileo-publications
CLOUDFLARE_R2_REGION=auto

# ==========================================
# SENDGRID - Email Notifications
# ==========================================
SENDGRID_API_KEY=votre_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@galileo.votredomaine.com
ADMIN_EMAIL=admin@galileo.votredomaine.com

# ==========================================
# DATABASE - PostgreSQL
# ==========================================
POSTGRES_USER=galileo_user
POSTGRES_PASSWORD=VotreMotDePasseSécurisé2025!

DB_LECTURE_NAME=db_galileo_lecture
DB_ECRITURE_NAME=db_galileo_ecriture

# ==========================================
# ELASTICSEARCH
# ==========================================
ELASTICSEARCH_URIS=http://elasticsearch:9200
ELASTICSEARCH_CONNECTION_TIMEOUT=5s
ELASTICSEARCH_SOCKET_TIMEOUT=30s

# ==========================================
# SPRING PROFILES
# ==========================================
SPRING_PROFILES_ACTIVE=docker

# ==========================================
# SERVICE URLS (Docker)
# ==========================================
LECTURE_SERVICE_URL=http://service-lecture:8081
ECRITURE_SERVICE_URL=http://service-ecriture:8082
FEIGN_CLIENT_LECTURE_URL=http://service-lecture:8081
```

**Sauvegarder et quitter :**
- Appuyez sur `Ctrl+X`
- Appuyez sur `Y` pour confirmer
- Appuyez sur `Enter`

### 6.3 Sécuriser le fichier .env

```bash
# Définir les permissions strictes
chmod 600 .env

# Vérifier que le fichier est protégé
ls -l .env
```

---

## Étape 7 : Configurer SSL avec Let's Encrypt

### 7.1 Installer Certbot

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Créer une configuration Nginx temporaire

```bash
# Créer un fichier de configuration Nginx pour la validation SSL
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Créer la configuration
sudo tee /etc/nginx/sites-available/galileo > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name galileo.votredomaine.com www.galileo.votredomaine.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Activer la configuration
sudo ln -s /etc/nginx/sites-available/galileo /etc/nginx/sites-enabled/

# Installer Nginx si nécessaire
sudo apt install -y nginx

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7.3 Obtenir un certificat SSL

```bash
# Obtenir le certificat SSL
sudo certbot --nginx -d galileo.votredomaine.com -d www.galileo.votredomaine.com

# Suivre les instructions :
# 1. Entrez votre email
# 2. Acceptez les termes de service
# 3. Choisissez de rediriger HTTP vers HTTPS (option 2)
```

### 7.4 Configurer le renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est déjà configuré via un cron job
```

### 7.5 Mettre à jour la configuration Nginx pour Docker

```bash
# Créer la configuration finale
sudo tee /etc/nginx/sites-available/galileo > /dev/null <<'EOF'
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name galileo.votredomaine.com www.galileo.votredomaine.com;
    return 301 https://\$server_name\$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name galileo.votredomaine.com www.galileo.votredomaine.com;
    
    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/galileo.votredomaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/galileo.votredomaine.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/galileo.votredomaine.com/chain.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logs
    access_log /var/log/nginx/galileo_access.log;
    error_log /var/log/nginx/galileo_error.log;
    
    # Taille maximale des uploads
    client_max_body_size 50M;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API Gateway
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Remplacer "galileo.votredomaine.com" par votre vrai domaine dans le fichier
sudo sed -i 's/galileo.votredomaine.com/VOTRE_DOMAINE_ICI/g' /etc/nginx/sites-available/galileo

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## Étape 8 : Déployer l'application

### 8.1 Préparer Docker Compose pour la production

```bash
cd ~/Galileo

# Créer un fichier docker-compose.prod.yml
cp docker-compose.yml docker-compose.prod.yml
```

**Modifier docker-compose.prod.yml pour la production :**

```bash
nano docker-compose.prod.yml
```

Ajoutez/modifiez les sections suivantes :

```yaml
services:
  frontend:
    env_file:
      - .env
    restart: always

  gateway:
    env_file:
      - .env
    restart: always

  service-lecture:
    env_file:
      - .env
    restart: always
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db-lecture:5432/${DB_LECTURE_NAME}
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - SPRING_ELASTICSEARCH_URIS=${ELASTICSEARCH_URIS}

  service-ecriture:
    env_file:
      - .env
    restart: always
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db-ecriture:5432/${DB_ECRITURE_NAME}
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}

  db-lecture:
    env_file:
      - .env
    restart: always
    environment:
      POSTGRES_DB: ${DB_LECTURE_NAME}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ~/galileo-data/postgres-lecture:/var/lib/postgresql/data

  db-ecriture:
    env_file:
      - .env
    restart: always
    environment:
      POSTGRES_DB: ${DB_ECRITURE_NAME}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ~/galileo-data/postgres-ecriture:/var/lib/postgresql/data

  elasticsearch:
    restart: always
    volumes:
      - ~/galileo-data/elasticsearch:/usr/share/elasticsearch/data
```

### 8.2 Build et démarrer les containers

```bash
# Build les images Docker (peut prendre 10-15 minutes)
docker compose -f docker-compose.prod.yml build

# Démarrer les services
docker compose -f docker-compose.prod.yml up -d

# Vérifier que tous les services sont démarrés
docker compose -f docker-compose.prod.yml ps
```

**Résultat attendu :**
```
NAME                      STATUS              PORTS
galileo-frontend          Up 2 minutes        0.0.0.0:3000->80/tcp
galileo-gateway           Up 2 minutes        0.0.0.0:8080->8080/tcp
galileo-service-lecture   Up 2 minutes        0.0.0.0:8081->8081/tcp
galileo-service-ecriture  Up 2 minutes        0.0.0.0:8082->8082/tcp
galileo-db-lecture        Up 2 minutes        0.0.0.0:5432->5432/tcp
galileo-db-ecriture       Up 2 minutes        0.0.0.0:5433->5432/tcp
galileo-elasticsearch     Up 2 minutes        0.0.0.0:9200->9200/tcp
```

### 8.3 Vérifier les logs

```bash
# Voir tous les logs
docker compose -f docker-compose.prod.yml logs

# Suivre les logs en temps réel
docker compose -f docker-compose.prod.yml logs -f

# Logs d'un service spécifique
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f gateway
```

### 8.4 Tester l'application

```bash
# Tester le frontend
curl http://localhost:3000

# Tester le gateway
curl http://localhost:8080/actuator/health

# Tester depuis l'extérieur
curl https://galileo.votredomaine.com
```

---

## Étape 9 : Configurer les sauvegardes

### 9.1 Créer un script de sauvegarde

```bash
# Créer le script de backup
cat > ~/backup-galileo.sh << 'EOF'
#!/bin/bash

# Configuration
BACKUP_DIR=~/galileo-data/backups
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

echo "🔄 Démarrage de la sauvegarde - $DATE"

# Backup des bases de données PostgreSQL
echo "📦 Sauvegarde des bases de données..."
docker exec galileo-db-lecture pg_dump -U galileo_user db_galileo_lecture | gzip > $BACKUP_DIR/db-lecture-$DATE.sql.gz
docker exec galileo-db-ecriture pg_dump -U galileo_user db_galileo_ecriture | gzip > $BACKUP_DIR/db-ecriture-$DATE.sql.gz

# Backup d'Elasticsearch
echo "📦 Sauvegarde Elasticsearch..."
docker exec galileo-elasticsearch curl -X PUT "localhost:9200/_snapshot/backup" -H 'Content-Type: application/json' -d'{"type":"fs","settings":{"location":"/usr/share/elasticsearch/data/backup"}}'

# Backup des fichiers de configuration
echo "📦 Sauvegarde des configurations..."
tar -czf $BACKUP_DIR/config-$DATE.tar.gz ~/Galileo/.env ~/Galileo/backend/galileo-gateway/config/

# Supprimer les vieilles sauvegardes
echo "🗑️  Nettoyage des anciennes sauvegardes..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Afficher la taille des backups
echo "📊 Taille des sauvegardes:"
du -sh $BACKUP_DIR

echo "✅ Sauvegarde terminée!"
EOF

# Rendre le script exécutable
chmod +x ~/backup-galileo.sh
```

### 9.2 Automatiser les sauvegardes avec Cron

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin
0 2 * * * /home/galileo/backup-galileo.sh >> /home/galileo/galileo-data/logs/backup.log 2>&1
```

### 9.3 Tester le script de sauvegarde

```bash
# Exécuter manuellement
~/backup-galileo.sh

# Vérifier les fichiers créés
ls -lh ~/galileo-data/backups/
```

### 9.4 Configurer les sauvegardes Digital Ocean (optionnel)

```bash
# Sur le dashboard Digital Ocean:
# 1. Allez dans votre Droplet
# 2. Cliquez sur "Backups"
# 3. Activez les backups hebdomadaires (coût: 20% du prix du Droplet)
```

---

## Étape 10 : Surveillance et maintenance

### 10.1 Créer un script de monitoring

```bash
# Créer un script de monitoring
cat > ~/monitor-galileo.sh << 'EOF'
#!/bin/bash

echo "🔍 État des services Galileo"
echo "=============================="
echo ""

# Docker status
echo "📊 Services Docker:"
docker compose -f ~/Galileo/docker-compose.prod.yml ps

echo ""
echo "💾 Utilisation disque:"
df -h | grep -E '^/dev/|Filesystem'

echo ""
echo "🧠 Utilisation mémoire:"
free -h

echo ""
echo "📈 CPU Load:"
uptime

echo ""
echo "🌐 Status Nginx:"
sudo systemctl status nginx --no-pager | grep Active

echo ""
echo "🔥 Dernières erreurs (10 dernières lignes):"
docker compose -f ~/Galileo/docker-compose.prod.yml logs --tail=10 | grep -i error || echo "Aucune erreur récente"

echo ""
echo "✅ Monitoring terminé!"
EOF

# Rendre le script exécutable
chmod +x ~/monitor-galileo.sh
```

### 10.2 Installer htop pour le monitoring

```bash
# htop est déjà installé, lancer avec:
htop
```

### 10.3 Configurer les alertes (optionnel)

Pour recevoir des alertes en cas de problème, installez et configurez **Netdata** :

```bash
# Installer Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Netdata sera accessible sur http://VOTRE_IP:19999
```

### 10.4 Commandes de maintenance courantes

```bash
# Voir les logs en temps réel
docker compose -f ~/Galileo/docker-compose.prod.yml logs -f

# Redémarrer un service spécifique
docker compose -f ~/Galileo/docker-compose.prod.yml restart frontend

# Redémarrer tous les services
docker compose -f ~/Galileo/docker-compose.prod.yml restart

# Voir l'utilisation des ressources
docker stats

# Nettoyer Docker (libérer de l'espace)
docker system prune -a --volumes

# Mettre à jour l'application
cd ~/Galileo
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## Sécurité

### ✅ Checklist de sécurité

- [x] **Pare-feu UFW configuré** (ports 22, 80, 443 ouverts uniquement)
- [x] **Fail2Ban activé** (protection contre les attaques brute-force)
- [x] **Certificat SSL Let's Encrypt** (HTTPS activé)
- [x] **Utilisateur non-root** (ne pas utiliser root pour les opérations quotidiennes)
- [x] **Authentification par clé SSH** (désactiver l'authentification par mot de passe)
- [x] **Variables d'environnement sécurisées** (.env avec permissions 600)
- [ ] **Backups automatiques** (quotidiens)
- [ ] **Monitoring actif** (Netdata ou équivalent)

### 🔒 Sécurisation supplémentaire

**Désactiver l'authentification par mot de passe SSH :**

```bash
sudo nano /etc/ssh/sshd_config
```

Modifiez ces lignes :
```
PasswordAuthentication no
PermitRootLogin no
```

```bash
# Redémarrer SSH
sudo systemctl restart sshd
```

**Changer le port SSH par défaut (optionnel) :**

```bash
sudo nano /etc/ssh/sshd_config
```

Modifiez :
```
Port 2222  # Au lieu de 22
```

```bash
# Autoriser le nouveau port
sudo ufw allow 2222/tcp
sudo ufw delete allow OpenSSH

# Redémarrer SSH
sudo systemctl restart sshd

# Se connecter avec le nouveau port
ssh -p 2222 galileo@VOTRE_IP
```

---

## Dépannage

### ❌ Problème : Les services ne démarrent pas

```bash
# Vérifier les logs
docker compose -f ~/Galileo/docker-compose.prod.yml logs

# Vérifier l'état des containers
docker compose -f ~/Galileo/docker-compose.prod.yml ps

# Redémarrer les services
docker compose -f ~/Galileo/docker-compose.prod.yml down
docker compose -f ~/Galileo/docker-compose.prod.yml up -d
```

### ❌ Problème : Erreur "Out of Memory"

```bash
# Vérifier la mémoire
free -h

# Si nécessaire, augmenter le swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### ❌ Problème : Base de données ne se connecte pas

```bash
# Vérifier que PostgreSQL est bien démarré
docker compose -f ~/Galileo/docker-compose.prod.yml ps db-lecture

# Vérifier les logs PostgreSQL
docker compose -f ~/Galileo/docker-compose.prod.yml logs db-lecture

# Se connecter à la base manuellement
docker exec -it galileo-db-lecture psql -U galileo_user -d db_galileo_lecture
```

### ❌ Problème : Nginx retourne 502 Bad Gateway

```bash
# Vérifier que les services backend sont up
docker compose -f ~/Galileo/docker-compose.prod.yml ps

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/galileo_error.log

# Tester le frontend localement
curl http://localhost:3000

# Redémarrer Nginx
sudo systemctl restart nginx
```

### ❌ Problème : Certificat SSL expiré

```bash
# Renouveler manuellement
sudo certbot renew

# Redémarrer Nginx
sudo systemctl reload nginx

# Vérifier la date d'expiration
sudo certbot certificates
```

### ❌ Problème : Disque plein

```bash
# Vérifier l'espace disque
df -h

# Nettoyer Docker
docker system prune -a --volumes

# Nettoyer les logs
sudo journalctl --vacuum-time=7d

# Supprimer les vieilles sauvegardes
find ~/galileo-data/backups -mtime +7 -delete
```

---

## 📚 Ressources utiles

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Digital Ocean](https://docs.digitalocean.com/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)

---

## 🎉 Félicitations !

Votre application Galileo est maintenant déployée sur Digital Ocean et accessible via HTTPS ! 🚀

**URL de votre application :** `https://galileo.votredomaine.com`

### Prochaines étapes recommandées :

1. ✅ Configurer un système de monitoring (Netdata, Prometheus)
2. ✅ Mettre en place des alertes automatiques
3. ✅ Configurer un CDN (Cloudflare) pour améliorer les performances
4. ✅ Implémenter une stratégie de déploiement continu (CI/CD)
5. ✅ Documenter vos procédures de maintenance

---

**Dernière mise à jour** : 22 décembre 2024

**Besoin d'aide ?** Consultez le fichier `DOCKER_DEPLOYMENT.md` pour plus de détails sur Docker.
