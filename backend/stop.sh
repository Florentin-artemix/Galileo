#!/bin/bash

# Script d'arrêt pour Galileo Backend

set -e

echo "=========================================="
echo "  Arrêt de Galileo Backend"
echo "=========================================="
echo ""

# Demander si on veut supprimer les volumes
read -p "Voulez-vous supprimer les données (volumes) ? (o/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "🗑️  Arrêt et suppression des volumes..."
    docker-compose down -v
    echo "✅ Services arrêtés et données supprimées"
else
    echo "🛑 Arrêt des services..."
    docker-compose down
    echo "✅ Services arrêtés (données conservées)"
fi

echo ""
echo "Pour redémarrer: ./start.sh"
echo ""
