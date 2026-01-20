#!/bin/bash

# =============================================================================
# Script de restauration pour Galileo
# =============================================================================
# Ce script restaure une sauvegarde de l'application
# Usage: bash restore.sh [backup_date]
# Exemple: bash restore.sh 20241222_140000
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Configuration
BACKUP_DIR=~/galileo-data/backups
PROJECT_DIR=~/Galileo

# Vérifier l'argument
if [ -z "$1" ]; then
    log_error "Usage: bash restore.sh [backup_date]"
    echo ""
    echo "Sauvegardes disponibles:"
    # List both lecture and ecriture backups
    ls -1 $BACKUP_DIR/db-*-*.sql.gz 2>/dev/null | sed 's/.*\/db-[^-]*-\(.*\)\.sql\.gz/  - \1/' | sort -u || echo "  Aucune sauvegarde trouvée"
    exit 1
fi

BACKUP_DATE=$1

# Vérifier que les fichiers existent
if [ ! -f "$BACKUP_DIR/db-lecture-$BACKUP_DATE.sql.gz" ] && [ ! -f "$BACKUP_DIR/db-ecriture-$BACKUP_DATE.sql.gz" ]; then
    log_error "Aucune sauvegarde trouvée pour la date: $BACKUP_DATE"
    exit 1
fi

echo "🔄 Restauration de la sauvegarde - $BACKUP_DATE"
echo "========================================"
log_warn "⚠️  ATTENTION: Cette opération va écraser les données actuelles!"
read -p "Êtes-vous sûr de vouloir continuer? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restauration annulée"
    exit 0
fi

# =============================================================================
# Arrêter les services
# =============================================================================
log_info "🛑 Arrêt des services..."
cd $PROJECT_DIR
docker compose -f docker-compose.prod.yml stop gateway service-lecture service-ecriture

# =============================================================================
# Restaurer la base de données Lecture
# =============================================================================
if [ -f "$BACKUP_DIR/db-lecture-$BACKUP_DATE.sql.gz" ]; then
    log_info "📥 Restauration de la base de données Lecture..."
    
    # Supprimer et recréer la base
    docker exec galileo-db-lecture psql -U galileo_user -c "DROP DATABASE IF EXISTS db_galileo_lecture;"
    docker exec galileo-db-lecture psql -U galileo_user -c "CREATE DATABASE db_galileo_lecture;"
    
    # Restaurer depuis le backup
    gunzip < $BACKUP_DIR/db-lecture-$BACKUP_DATE.sql.gz | docker exec -i galileo-db-lecture psql -U galileo_user db_galileo_lecture
    
    log_info "✓ Base de données Lecture restaurée"
else
    log_warn "⚠ Backup de la base Lecture non trouvé"
fi

# =============================================================================
# Restaurer la base de données Écriture
# =============================================================================
if [ -f "$BACKUP_DIR/db-ecriture-$BACKUP_DATE.sql.gz" ]; then
    log_info "📥 Restauration de la base de données Écriture..."
    
    # Supprimer et recréer la base
    docker exec galileo-db-ecriture psql -U galileo_user -c "DROP DATABASE IF EXISTS db_galileo_ecriture;"
    docker exec galileo-db-ecriture psql -U galileo_user -c "CREATE DATABASE db_galileo_ecriture;"
    
    # Restaurer depuis le backup
    gunzip < $BACKUP_DIR/db-ecriture-$BACKUP_DATE.sql.gz | docker exec -i galileo-db-ecriture psql -U galileo_user db_galileo_ecriture
    
    log_info "✓ Base de données Écriture restaurée"
else
    log_warn "⚠ Backup de la base Écriture non trouvé"
fi

# =============================================================================
# Restaurer les configurations (si demandé)
# =============================================================================
if [ -f "$BACKUP_DIR/config-$BACKUP_DATE.tar.gz" ]; then
    read -p "Restaurer aussi les configurations? (yes/no): " restore_config
    
    if [ "$restore_config" == "yes" ]; then
        log_info "📥 Restauration des configurations..."
        tar -xzf $BACKUP_DIR/config-$BACKUP_DATE.tar.gz -C $PROJECT_DIR
        log_info "✓ Configurations restaurées"
    fi
fi

# =============================================================================
# Redémarrer les services
# =============================================================================
log_info "🚀 Redémarrage des services..."
docker compose -f docker-compose.prod.yml start gateway service-lecture service-ecriture

# Attendre que les services soient prêts
sleep 5

# =============================================================================
# Vérifier l'état des services
# =============================================================================
log_info "🔍 Vérification de l'état des services..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "========================================"
log_info "✅ Restauration terminée avec succès!"
echo "========================================"
log_info "Vérifiez que l'application fonctionne correctement"
