#!/bin/bash

# =============================================================================
# Script d'installation automatique pour Digital Ocean
# =============================================================================
# Ce script configure automatiquement un nouveau serveur Ubuntu pour Galileo
# Usage: bash setup-server.sh
# =============================================================================

set -e

echo "🚀 Configuration du serveur pour Galileo"
echo "========================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que le script n'est pas exécuté en tant que root
if [ "$EUID" -eq 0 ]; then 
    log_error "Ne pas exécuter ce script en tant que root"
    log_info "Exécutez: bash setup-server.sh (sans sudo)"
    exit 1
fi

# =============================================================================
# ÉTAPE 1: Mise à jour du système
# =============================================================================
log_info "Étape 1/9: Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# =============================================================================
# ÉTAPE 2: Installation des outils essentiels
# =============================================================================
log_info "Étape 2/9: Installation des outils essentiels..."
sudo apt install -y curl wget git vim ufw fail2ban htop net-tools

# =============================================================================
# ÉTAPE 3: Configuration du pare-feu
# =============================================================================
log_info "Étape 3/9: Configuration du pare-feu UFW..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

log_info "Statut du pare-feu:"
sudo ufw status

# =============================================================================
# ÉTAPE 4: Configuration de Fail2Ban
# =============================================================================
log_info "Étape 4/9: Configuration de Fail2Ban..."
if [ ! -f /etc/fail2ban/jail.local ]; then
    sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
fi

sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = systemd
EOF

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# =============================================================================
# ÉTAPE 5: Installation de Docker
# =============================================================================
log_info "Étape 5/9: Installation de Docker..."

# Supprimer les anciennes versions
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do 
    sudo apt-get remove -y $pkg 2>/dev/null || true
done

# Installer les prérequis
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Ajouter la clé GPG de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Ajouter le repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Activer Docker au démarrage
sudo systemctl enable docker
sudo systemctl start docker

log_info "Version de Docker: $(docker --version 2>/dev/null || echo 'Docker sera disponible après reconnexion')"
log_info "Version de Docker Compose: $(docker compose version 2>/dev/null || echo 'Disponible après reconnexion')"

# =============================================================================
# ÉTAPE 6: Installation de Nginx
# =============================================================================
log_info "Étape 6/9: Installation de Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# =============================================================================
# ÉTAPE 7: Installation de Certbot
# =============================================================================
log_info "Étape 7/9: Installation de Certbot pour SSL..."
sudo apt install -y certbot python3-certbot-nginx

# =============================================================================
# ÉTAPE 8: Création des dossiers de données
# =============================================================================
log_info "Étape 8/9: Création des dossiers de données..."
mkdir -p ~/galileo-data/postgres-lecture
mkdir -p ~/galileo-data/postgres-ecriture
mkdir -p ~/galileo-data/elasticsearch
mkdir -p ~/galileo-data/backups
mkdir -p ~/galileo-data/logs
chmod -R 755 ~/galileo-data

# =============================================================================
# ÉTAPE 9: Configuration du swap (si nécessaire)
# =============================================================================
if [ ! -f /swapfile ]; then
    log_info "Étape 9/9: Configuration du swap (2GB)..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    log_info "Swap configuré"
else
    log_info "Swap déjà configuré"
fi

# =============================================================================
# FIN
# =============================================================================
echo ""
echo "========================================"
log_info "✅ Configuration terminée avec succès!"
echo "========================================"
echo ""
log_warn "IMPORTANT: Vous devez vous reconnecter pour que Docker fonctionne sans sudo"
log_info "Exécutez: exit"
log_info "Puis reconnectez-vous: ssh $USER@\$(hostname -I | awk '{print \$1}')"
echo ""
log_info "Prochaines étapes:"
echo "  1. Reconnectez-vous au serveur"
echo "  2. Clonez le repository: git clone https://github.com/Florentin-artemix/Galileo.git"
echo "  3. Configurez les variables d'environnement: cd Galileo && cp .env.example .env && nano .env"
echo "  4. Configurez le domaine et SSL (voir DIGITAL_OCEAN_DEPLOYMENT.md)"
echo "  5. Déployez l'application: docker compose -f docker-compose.prod.yml up -d"
echo ""
log_info "Documentation complète: DIGITAL_OCEAN_DEPLOYMENT.md"
