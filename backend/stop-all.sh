#!/bin/bash

# Script d'arrêt pour tous les services Galileo
# Usage: ./stop-all.sh

set -e

echo "================================"
echo "Arrêt des services Galileo"
echo "================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Arrêter les services Java
echo -e "${YELLOW}Arrêt des services Java...${NC}"

if [ -f /tmp/galileo-gateway.pid ]; then
    PID=$(cat /tmp/galileo-gateway.pid)
    echo "Arrêt du Gateway (PID: $PID)..."
    kill $PID 2>/dev/null || echo -e "${YELLOW}Gateway déjà arrêté${NC}"
    rm /tmp/galileo-gateway.pid
fi

if [ -f /tmp/galileo-lecture.pid ]; then
    PID=$(cat /tmp/galileo-lecture.pid)
    echo "Arrêt du Service Lecture (PID: $PID)..."
    kill $PID 2>/dev/null || echo -e "${YELLOW}Service Lecture déjà arrêté${NC}"
    rm /tmp/galileo-lecture.pid
fi

if [ -f /tmp/galileo-ecriture.pid ]; then
    PID=$(cat /tmp/galileo-ecriture.pid)
    echo "Arrêt du Service Écriture (PID: $PID)..."
    kill $PID 2>/dev/null || echo -e "${YELLOW}Service Écriture déjà arrêté${NC}"
    rm /tmp/galileo-ecriture.pid
fi

# Attendre que les processus se terminent
sleep 3

# Forcer l'arrêt si nécessaire
echo -e "${YELLOW}Vérification des processus Java restants...${NC}"
pkill -f "galileo-gateway" 2>/dev/null || true
pkill -f "galileo-lecture" 2>/dev/null || true
pkill -f "galileo-ecriture" 2>/dev/null || true

# Arrêter les services Docker
echo -e "\n${YELLOW}Arrêt des services Docker...${NC}"
cd /workspaces/Galileo/backend
docker-compose down

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Tous les services sont arrêtés${NC}"
echo -e "${GREEN}================================${NC}"
