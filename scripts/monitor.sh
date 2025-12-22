#!/bin/bash

# =============================================================================
# Script de monitoring pour Galileo
# =============================================================================
# Ce script affiche l'état actuel de l'application et des services
# Usage: bash monitor.sh
# =============================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_header() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

PROJECT_DIR=~/Galileo

clear
echo "======================================"
echo "🔍 Monitoring Galileo - $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
echo ""

# =============================================================================
# État des services Docker
# =============================================================================
log_header "📊 Services Docker:"
echo "--------------------------------------"
if [ -d "$PROJECT_DIR" ]; then
    cd $PROJECT_DIR
    docker compose -f docker-compose.prod.yml ps 2>/dev/null || docker compose ps 2>/dev/null || echo "Aucun service en cours d'exécution"
else
    log_error "Dossier projet non trouvé: $PROJECT_DIR"
fi
echo ""

# =============================================================================
# Santé des services
# =============================================================================
log_header "💚 Santé des services:"
echo "--------------------------------------"

check_service() {
    local service=$1
    local url=$2
    if curl -sf $url > /dev/null 2>&1; then
        log_success "$service - En ligne"
    else
        log_error "$service - Hors ligne"
    fi
}

check_service "Frontend" "http://localhost:3000"
check_service "Gateway" "http://localhost:8080/actuator/health"
check_service "Service Lecture" "http://localhost:8081/actuator/health"
check_service "Service Écriture" "http://localhost:8082/actuator/health"
check_service "Elasticsearch" "http://localhost:9200/_cluster/health"

echo ""

# =============================================================================
# Utilisation des ressources
# =============================================================================
log_header "💾 Utilisation du disque:"
echo "--------------------------------------"
df -h / | tail -n 1 | awk '{printf "  Racine: %s utilisé sur %s (%s)\n", $3, $2, $5}'
df -h ~/galileo-data 2>/dev/null | tail -n 1 | awk '{printf "  Données: %s utilisé sur %s (%s)\n", $3, $2, $5}' || echo "  Données: Dossier non trouvé"

echo ""
log_header "🧠 Utilisation de la mémoire:"
echo "--------------------------------------"
free -h | grep "Mem:" | awk '{printf "  RAM: %s utilisé sur %s (%s)\n", $3, $2, $3"/"$2}'
free -h | grep "Swap:" | awk '{printf "  Swap: %s utilisé sur %s\n", $3, $2}'

echo ""
log_header "📈 Charge CPU:"
echo "--------------------------------------"
uptime | awk '{printf "  Load Average: %s %s %s\n", $(NF-2), $(NF-1), $NF}'

echo ""

# =============================================================================
# Statistiques Docker
# =============================================================================
log_header "🐳 Statistiques Docker (Top 5 containers):"
echo "--------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -n 6

echo ""

# =============================================================================
# Logs récents (erreurs)
# =============================================================================
log_header "🔥 Erreurs récentes (dernières 5 minutes):"
echo "--------------------------------------"
if [ -d "$PROJECT_DIR" ]; then
    cd $PROJECT_DIR
    recent_errors=$(docker compose -f docker-compose.prod.yml logs --since=5m 2>&1 | grep -i "error\|exception\|fatal" | tail -n 5)
    if [ -z "$recent_errors" ]; then
        log_success "Aucune erreur récente"
    else
        echo "$recent_errors" | while read line; do
            log_error "$line"
        done
    fi
else
    log_warning "Impossible de vérifier les logs"
fi

echo ""

# =============================================================================
# Status Nginx
# =============================================================================
log_header "🌐 Status Nginx:"
echo "--------------------------------------"
if systemctl is-active --quiet nginx; then
    log_success "Nginx actif"
else
    log_error "Nginx inactif"
fi

echo ""

# =============================================================================
# Certificats SSL
# =============================================================================
log_header "🔒 Certificats SSL:"
echo "--------------------------------------"
if [ -d "/etc/letsencrypt/live" ]; then
    for cert_dir in /etc/letsencrypt/live/*/; do
        if [ -f "$cert_dir/fullchain.pem" ]; then
            domain=$(basename "$cert_dir")
            expiry=$(sudo openssl x509 -enddate -noout -in "$cert_dir/fullchain.pem" 2>/dev/null | cut -d= -f2)
            expiry_date=$(date -d "$expiry" +%Y-%m-%d 2>/dev/null || echo "Date invalide")
            days_left=$(( ($(date -d "$expiry" +%s 2>/dev/null || echo 0) - $(date +%s)) / 86400 ))
            
            if [ $days_left -gt 30 ]; then
                log_success "$domain expire le $expiry_date ($days_left jours restants)"
            elif [ $days_left -gt 0 ]; then
                log_warning "$domain expire le $expiry_date ($days_left jours restants)"
            else
                log_error "$domain a expiré!"
            fi
        fi
    done
else
    log_warning "Aucun certificat SSL trouvé"
fi

echo ""

# =============================================================================
# Dernières sauvegardes
# =============================================================================
log_header "💾 Dernières sauvegardes:"
echo "--------------------------------------"
if [ -d ~/galileo-data/backups ]; then
    latest_backup=$(ls -t ~/galileo-data/backups/*.sql.gz 2>/dev/null | head -n 1)
    if [ -n "$latest_backup" ]; then
        backup_date=$(basename "$latest_backup" | grep -oP '\d{8}_\d{6}')
        backup_size=$(du -sh ~/galileo-data/backups 2>/dev/null | awk '{print $1}')
        log_success "Dernière sauvegarde: $backup_date (Taille totale: $backup_size)"
    else
        log_warning "Aucune sauvegarde trouvée"
    fi
else
    log_warning "Dossier de sauvegardes non trouvé"
fi

echo ""
echo "======================================"
log_header "Pour plus de détails:"
echo "  docker compose logs -f [service]"
echo "  docker stats"
echo "  htop"
echo "======================================"
