# 📜 Scripts de Gestion Galileo

Ce dossier contient des scripts bash pour faciliter la gestion et le déploiement de l'application Galileo sur Digital Ocean.

## 📋 Liste des scripts

### 🚀 setup-server.sh
**Configuration initiale du serveur**

Configure automatiquement un nouveau serveur Ubuntu pour héberger Galileo.

**Fonctionnalités:**
- Installation de Docker et Docker Compose
- Configuration du pare-feu UFW
- Installation et configuration de Fail2Ban
- Installation de Nginx et Certbot
- Configuration du swap
- Création des dossiers de données

**Usage:**
```bash
# Sur le serveur Digital Ocean (première connexion)
wget https://raw.githubusercontent.com/Florentin-artemix/Galileo/main/scripts/setup-server.sh
bash setup-server.sh
```

---

### 🎯 deploy.sh
**Déploiement et mise à jour de l'application**

Gère le déploiement complet et les mises à jour de l'application.

**Fonctionnalités:**
- Build et déploiement initial
- Mise à jour depuis Git
- Redémarrage des services
- Arrêt des services

**Usage:**
```bash
# Première installation (build complet)
bash scripts/deploy.sh build

# Mise à jour de l'application
bash scripts/deploy.sh update

# Redémarrer les services
bash scripts/deploy.sh restart

# Arrêter les services
bash scripts/deploy.sh stop

# Voir l'état des services
bash scripts/deploy.sh status
```

---

### 💾 backup.sh
**Sauvegarde de l'application**

Effectue une sauvegarde complète des bases de données, Elasticsearch et configurations.

**Fonctionnalités:**
- Sauvegarde PostgreSQL (Lecture et Écriture)
- Sauvegarde Elasticsearch
- Sauvegarde des configurations (.env, Firebase)
- Nettoyage automatique des anciennes sauvegardes (7 jours)

**Usage:**
```bash
# Sauvegarde manuelle
bash scripts/backup.sh

# Automatiser avec cron (quotidien à 2h du matin)
crontab -e
# Ajouter cette ligne:
0 2 * * * /home/galileo/Galileo/scripts/backup.sh >> /home/galileo/galileo-data/logs/backup.log 2>&1
```

**Emplacement des sauvegardes:**
```
~/galileo-data/backups/
├── db-lecture-YYYYMMDD_HHMMSS.sql.gz
├── db-ecriture-YYYYMMDD_HHMMSS.sql.gz
├── config-YYYYMMDD_HHMMSS.tar.gz
└── gateway-config-YYYYMMDD_HHMMSS.tar.gz
```

---

### 🔄 restore.sh
**Restauration d'une sauvegarde**

Restaure les bases de données et configurations depuis une sauvegarde.

**Fonctionnalités:**
- Restauration PostgreSQL
- Restauration des configurations
- Arrêt/redémarrage automatique des services
- Confirmation avant écrasement des données

**Usage:**
```bash
# Lister les sauvegardes disponibles
bash scripts/restore.sh

# Restaurer une sauvegarde spécifique
bash scripts/restore.sh 20241222_140000
```

**⚠️ Attention:** Cette opération écrase les données existantes. Une confirmation est demandée.

---

### 📊 monitor.sh
**Surveillance de l'application**

Affiche un tableau de bord en temps réel de l'état de l'application.

**Fonctionnalités:**
- État des services Docker
- Santé des services (health checks)
- Utilisation des ressources (CPU, RAM, disque)
- Erreurs récentes dans les logs
- État des certificats SSL
- Date de la dernière sauvegarde

**Usage:**
```bash
# Afficher le monitoring
bash scripts/monitor.sh

# Monitoring en temps réel (toutes les 5 secondes)
watch -n 5 bash scripts/monitor.sh
```

---

## 🔧 Configuration des scripts

### Variables d'environnement
Les scripts utilisent ces emplacements par défaut:
- **Projet:** `~/Galileo`
- **Données:** `~/galileo-data`
- **Sauvegardes:** `~/galileo-data/backups`
- **Logs:** `~/galileo-data/logs`

Pour modifier ces emplacements, éditez les variables au début de chaque script.

---

## 📝 Workflow recommandé

### Installation initiale

```bash
# 1. Configurer le serveur
bash scripts/setup-server.sh

# 2. Se reconnecter (pour appliquer les changements Docker)
exit
ssh galileo@VOTRE_IP

# 3. Cloner le projet
git clone https://github.com/Florentin-artemix/Galileo.git
cd Galileo

# 4. Configurer l'environnement
cp .env.example .env
nano .env  # Configurer les variables

# 5. Ajouter les credentials Firebase
# scp firebase-credentials.json galileo@VOTRE_IP:~/Galileo/backend/galileo-gateway/config/

# 6. Déployer l'application
bash scripts/deploy.sh build

# 7. Configurer les sauvegardes automatiques
crontab -e
# Ajouter: 0 2 * * * /home/galileo/Galileo/scripts/backup.sh >> /home/galileo/galileo-data/logs/backup.log 2>&1
```

### Mise à jour de l'application

```bash
# Mettre à jour depuis Git et redéployer
bash scripts/deploy.sh update

# Ou simplement redémarrer
bash scripts/deploy.sh restart
```

### Surveillance quotidienne

```bash
# Vérifier l'état de l'application
bash scripts/monitor.sh

# Vérifier les logs
docker compose logs -f
```

### Sauvegarde et restauration

```bash
# Sauvegarde manuelle avant une mise à jour
bash scripts/backup.sh

# Restauration en cas de problème
bash scripts/restore.sh 20241222_140000
```

---

## 🚨 Dépannage

### Les scripts ne s'exécutent pas

```bash
# Vérifier les permissions
ls -la scripts/

# Rendre les scripts exécutables
chmod +x scripts/*.sh
```

### Erreur "Docker not found"

```bash
# Vérifier l'installation de Docker
docker --version

# Reconnecter la session
exit
ssh galileo@VOTRE_IP
```

### Erreur "Project directory not found"

```bash
# Vérifier l'emplacement du projet
pwd
cd ~/Galileo

# Ajuster la variable PROJECT_DIR dans les scripts si nécessaire
```

---

## 📚 Ressources supplémentaires

- [Guide complet de déploiement Digital Ocean](../DIGITAL_OCEAN_DEPLOYMENT.md)
- [Documentation Docker](../DOCKER_DEPLOYMENT.md)
- [README principal](../README.md)

---

## ⚠️ Notes importantes

1. **Sécurité**: Ne commitez jamais le fichier `.env` ou les credentials Firebase
2. **Sauvegardes**: Configurez les sauvegardes automatiques dès le déploiement
3. **Monitoring**: Surveillez régulièrement l'état de l'application
4. **Mises à jour**: Testez toujours les mises à jour dans un environnement de staging
5. **Logs**: Consultez régulièrement les logs pour détecter les problèmes

---

**Dernière mise à jour**: 22 décembre 2024
