#!/bin/bash

# =============================================================================
# Script de sauvegarde pour Galileo
# =============================================================================
# Ce script effectue une sauvegarde complète de l'application
# Usage: bash backup.sh
# =============================================================================

set -e

# Configuration
BACKUP_DIR=~/galileo-data/backups
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
PROJECT_DIR=~/Galileo

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

echo "🔄 Démarrage de la sauvegarde - $DATE"
echo "========================================"

# =============================================================================
# Backup des bases de données PostgreSQL
# =============================================================================
log_info "📦 Sauvegarde des bases de données PostgreSQL..."

if docker ps | grep -q galileo-db-lecture; then
    docker exec galileo-db-lecture pg_dump -U galileo_user db_galileo_lecture | gzip > $BACKUP_DIR/db-lecture-$DATE.sql.gz
    log_info "✓ Base de données Lecture sauvegardée"
else
    log_warn "⚠ Container galileo-db-lecture non trouvé"
fi

if docker ps | grep -q galileo-db-ecriture; then
    docker exec galileo-db-ecriture pg_dump -U galileo_user db_galileo_ecriture | gzip > $BACKUP_DIR/db-ecriture-$DATE.sql.gz
    log_info "✓ Base de données Écriture sauvegardée"
else
    log_warn "⚠ Container galileo-db-ecriture non trouvé"
fi

# =============================================================================
# Backup d'Elasticsearch
# =============================================================================
log_info "📦 Sauvegarde Elasticsearch..."

if docker ps | grep -q galileo-elasticsearch; then
    # Créer un snapshot repository si nécessaire
    docker exec galileo-elasticsearch curl -s -X PUT "localhost:9200/_snapshot/backup" \
        -H 'Content-Type: application/json' \
        -d'{"type":"fs","settings":{"location":"/usr/share/elasticsearch/data/backup"}}' > /dev/null 2>&1 || true
    
    # Créer un snapshot
    docker exec galileo-elasticsearch curl -s -X PUT "localhost:9200/_snapshot/backup/snapshot_$DATE" \
        -H 'Content-Type: application/json' \
        -d'{"indices":"*","ignore_unavailable":true,"include_global_state":false}' > /dev/null 2>&1
    
    log_info "✓ Elasticsearch sauvegardé"
else
    log_warn "⚠ Container galileo-elasticsearch non trouvé"
fi

# =============================================================================
# Backup des fichiers de configuration
# =============================================================================
log_info "📦 Sauvegarde des configurations..."

if [ -f "$PROJECT_DIR/.env" ]; then
    tar -czf $BACKUP_DIR/config-$DATE.tar.gz \
        -C $PROJECT_DIR .env 2>/dev/null || true
    
    if [ -d "$PROJECT_DIR/backend/galileo-gateway/config" ]; then
        tar -czf $BACKUP_DIR/gateway-config-$DATE.tar.gz \
            -C $PROJECT_DIR/backend/galileo-gateway config/ 2>/dev/null || true
    fi
    
    log_info "✓ Configurations sauvegardées"
else
    log_warn "⚠ Fichier .env non trouvé"
fi

# =============================================================================
# Backup des volumes Docker (optionnel - peut être volumineux)
# =============================================================================
# Décommentez cette section si vous voulez sauvegarder les volumes complets
# log_info "📦 Sauvegarde des volumes Docker..."
# tar -czf $BACKUP_DIR/volumes-$DATE.tar.gz ~/galileo-data/postgres-lecture ~/galileo-data/postgres-ecriture

# =============================================================================
# Supprimer les vieilles sauvegardes
# =============================================================================
log_info "🗑️  Nettoyage des anciennes sauvegardes (> $RETENTION_DAYS jours)..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# =============================================================================
# Afficher les statistiques
# =============================================================================
echo ""
echo "========================================"
log_info "📊 Statistiques des sauvegardes:"
echo "========================================"
echo "Emplacement: $BACKUP_DIR"
echo "Taille totale: $(du -sh $BACKUP_DIR | awk '{print $1}')"
echo ""
echo "Fichiers créés:"
ls -lh $BACKUP_DIR/*$DATE* 2>/dev/null || log_warn "Aucun fichier de backup créé"

echo ""
echo "========================================"
log_info "✅ Sauvegarde terminée avec succès!"
echo "========================================"
