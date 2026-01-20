#!/bin/bash

# =============================================================================
# Script de déploiement rapide pour Galileo
# =============================================================================
# Ce script déploie ou met à jour l'application
# Usage: bash deploy.sh [option]
# Options: 
#   - build: Build et déploie (première installation)
#   - update: Met à jour l'application depuis Git
#   - restart: Redémarre les services
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${BLUE}$1${NC}"
}

# Configuration
PROJECT_DIR=~/Galileo
COMPOSE_FILE=docker-compose.prod.yml

# Vérifier que le projet existe
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Projet non trouvé dans $PROJECT_DIR"
    log_info "Clonez d'abord le projet: git clone https://github.com/Florentin-artemix/Galileo.git"
    exit 1
fi

cd $PROJECT_DIR

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_error "Fichier .env manquant"
        log_info "Copiez .env.example vers .env et configurez-le: cp .env.example .env && nano .env"
        exit 1
    fi
    
    log_info "✓ Prérequis vérifiés"
}

# Fonction pour build et déployer
deploy_build() {
    log_header "🏗️  BUILD ET DÉPLOIEMENT"
    echo "========================================"
    
    check_prerequisites
    
    log_info "Arrêt des anciens containers..."
    docker compose -f $COMPOSE_FILE down || true
    
    log_info "Build des images Docker (peut prendre 10-15 minutes)..."
    docker compose -f $COMPOSE_FILE build --no-cache
    
    log_info "Démarrage des services..."
    docker compose -f $COMPOSE_FILE up -d
    
    log_info "Attente du démarrage des services (30 secondes)..."
    sleep 30
    
    log_info "Vérification de l'état des services..."
    docker compose -f $COMPOSE_FILE ps
    
    echo ""
    echo "========================================"
    log_info "✅ Déploiement terminé!"
    echo "========================================"
    log_info "Vérifiez l'application: https://votre-domaine.com"
    log_info "Logs: docker compose -f $COMPOSE_FILE logs -f"
}

# Fonction pour mettre à jour
deploy_update() {
    log_header "🔄 MISE À JOUR"
    echo "========================================"
    
    check_prerequisites
    
    log_info "Sauvegarde avant mise à jour..."
    bash ~/Galileo/scripts/backup.sh || log_warn "Sauvegarde échouée"
    
    log_info "Récupération des dernières modifications..."
    # Get current branch name
    current_branch=$(git branch --show-current)
    git pull origin "$current_branch"
    
    log_info "Arrêt des services..."
    docker compose -f $COMPOSE_FILE down
    
    log_info "Rebuild des images modifiées..."
    docker compose -f $COMPOSE_FILE build
    
    log_info "Redémarrage des services..."
    docker compose -f $COMPOSE_FILE up -d
    
    log_info "Attente du démarrage (30 secondes)..."
    sleep 30
    
    log_info "Nettoyage des anciennes images..."
    docker image prune -f
    
    echo ""
    echo "========================================"
    log_info "✅ Mise à jour terminée!"
    echo "========================================"
    docker compose -f $COMPOSE_FILE ps
}

# Fonction pour redémarrer
deploy_restart() {
    log_header "🔄 REDÉMARRAGE"
    echo "========================================"
    
    log_info "Redémarrage des services..."
    docker compose -f $COMPOSE_FILE restart
    
    log_info "Attente du démarrage (15 secondes)..."
    sleep 15
    
    echo ""
    log_info "✅ Services redémarrés"
    docker compose -f $COMPOSE_FILE ps
}

# Fonction pour arrêter
deploy_stop() {
    log_header "🛑 ARRÊT"
    echo "========================================"
    
    log_info "Arrêt des services..."
    docker compose -f $COMPOSE_FILE stop
    
    echo ""
    log_info "✅ Services arrêtés"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: bash deploy.sh [option]"
    echo ""
    echo "Options disponibles:"
    echo "  build    - Build et déploie l'application (première installation)"
    echo "  update   - Met à jour l'application depuis Git"
    echo "  restart  - Redémarre tous les services"
    echo "  stop     - Arrête tous les services"
    echo "  status   - Affiche l'état des services"
    echo ""
    echo "Exemples:"
    echo "  bash deploy.sh build     # Première installation"
    echo "  bash deploy.sh update    # Mise à jour"
    echo "  bash deploy.sh restart   # Redémarrage simple"
}

# Main
case "${1:-}" in
    build)
        deploy_build
        ;;
    update)
        deploy_update
        ;;
    restart)
        deploy_restart
        ;;
    stop)
        deploy_stop
        ;;
    status)
        docker compose -f $COMPOSE_FILE ps
        ;;
    *)
        show_help
        exit 1
        ;;
esac
