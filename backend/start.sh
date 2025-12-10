#!/bin/bash

# Script de démarrage complet pour Galileo Backend
# Ce script construit et démarre tous les services

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "  Démarrage de Galileo Backend"
echo "=========================================="
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Le fichier .env n'existe pas. Création depuis .env.example..."
    cp .env.example .env
    echo "✅ Fichier .env créé. Veuillez le configurer avec vos vraies valeurs."
    echo ""
fi

# Vérifier que les credentials Firebase existent
if [ ! -f config/firebase-credentials.json ]; then
    echo "⚠️  Le fichier firebase-credentials.json n'existe pas."
    echo "   Copiez votre fichier de credentials Firebase dans backend/config/"
    echo ""
    read -p "Voulez-vous continuer sans Firebase (mode développement) ? (o/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        exit 1
    fi
    # Créer un fichier temporaire pour le dev
    mkdir -p config
    cp config/firebase-credentials.json.example config/firebase-credentials.json
fi

# Arrêter les services existants
echo "🛑 Arrêt des services existants..."
docker-compose down

# Nettoyer les images obsolètes (optionnel)
echo ""
read -p "Voulez-vous nettoyer les anciennes images Docker ? (o/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "🧹 Nettoyage des images obsolètes..."
    docker-compose down --rmi local
fi

# Construire les images
echo ""
echo "🔨 Construction des images Docker..."
docker-compose build --no-cache

# Démarrer les services
echo ""
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo ""
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier le statut des services
echo ""
echo "📊 Statut des services:"
docker-compose ps

# Test des health checks
echo ""
echo "🏥 Vérification de la santé des services..."

# Attendre que le gateway soit prêt
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "✅ Gateway (8080): OK"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   En attente du gateway... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Le gateway n'a pas démarré correctement"
fi

# Service Lecture
if curl -f http://localhost:8081/actuator/health > /dev/null 2>&1; then
    echo "✅ Service Lecture (8081): OK"
else
    echo "❌ Service Lecture (8081): Erreur"
fi

# Service Écriture
if curl -f http://localhost:8082/actuator/health > /dev/null 2>&1; then
    echo "✅ Service Écriture (8082): OK"
else
    echo "❌ Service Écriture (8082): Erreur"
fi

# Elasticsearch
if curl -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
    echo "✅ Elasticsearch (9200): OK"
else
    echo "❌ Elasticsearch (9200): Erreur"
fi

echo ""
echo "=========================================="
echo "  🎉 Galileo Backend est démarré !"
echo "=========================================="
echo ""
echo "📍 URLs des services:"
echo "   - Gateway:             http://localhost:8080"
echo "   - Service Lecture:     http://localhost:8081"
echo "   - Service Écriture:    http://localhost:8082"
echo "   - Elasticsearch:       http://localhost:9200"
echo "   - PostgreSQL Lecture:  localhost:5432"
echo "   - PostgreSQL Écriture: localhost:5433"
echo ""
echo "📝 Commandes utiles:"
echo "   - Voir les logs:        docker-compose logs -f"
echo "   - Arrêter les services: docker-compose down"
echo "   - Redémarrer:          ./start.sh"
echo ""
