#!/bin/bash

echo "==================================="
echo "GALILEO - Script de Déploiement"
echo "==================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVER="root@143.110.132.26"
DEPLOY_DIR="/opt/galileo"

echo -e "${YELLOW}[1/5] Vérification de la connexion au serveur...${NC}"
if ssh -o ConnectTimeout=5 $SERVER "echo 'Connexion OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connexion établie${NC}"
else
    echo -e "${RED}✗ Impossible de se connecter au serveur${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[2/5] Vérification des fichiers de configuration...${NC}"
ssh $SERVER "ls -la $DEPLOY_DIR/.env $DEPLOY_DIR/backend/galileo-gateway/config/firebase-credentials.json" 2>&1 | grep -q ".env"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Fichiers de configuration présents${NC}"
else
    echo -e "${RED}✗ Fichiers de configuration manquants${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[3/5] Arrêt des conteneurs existants...${NC}"
ssh $SERVER "cd $DEPLOY_DIR && docker-compose down" > /dev/null 2>&1
echo -e "${GREEN}✓ Conteneurs arrêtés${NC}"

echo ""
echo -e "${YELLOW}[4/5] Construction et démarrage des services (cela peut prendre 5-10 minutes)...${NC}"
ssh $SERVER "cd $DEPLOY_DIR && docker-compose up -d --build" 2>&1 | tee /tmp/deploy.log

echo ""
echo -e "${YELLOW}[5/5] Vérification de l'état des services...${NC}"
sleep 10

ssh $SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo -e "${YELLOW}Vérification de la santé des services...${NC}"
ssh $SERVER "docker ps --filter 'health=healthy' --format '{{.Names}}' | wc -l" > /tmp/healthy_count.txt
HEALTHY=$(cat /tmp/healthy_count.txt)

echo ""
if [ "$HEALTHY" -gt "0" ]; then
    echo -e "${GREEN}✓ $HEALTHY service(s) en bonne santé${NC}"
    echo ""
    echo -e "${GREEN}==================================="
    echo "DÉPLOIEMENT RÉUSSI!"
    echo "===================================${NC}"
    echo ""
    echo "Accès à l'application:"
    echo "  - Frontend: http://143.110.132.26:3000"
    echo "  - API Gateway: http://143.110.132.26:8080"
    echo "  - Elasticsearch: http://143.110.132.26:9200"
    echo ""
    echo "Commandes utiles:"
    echo "  - Voir les logs: ssh $SERVER 'cd $DEPLOY_DIR && docker-compose logs -f'"
    echo "  - Redémarrer: ssh $SERVER 'cd $DEPLOY_DIR && docker-compose restart'"
    echo "  - Arrêter: ssh $SERVER 'cd $DEPLOY_DIR && docker-compose down'"
else
    echo -e "${RED}✗ Aucun service en bonne santé${NC}"
    echo ""
    echo "Vérifiez les logs avec:"
    echo "  ssh $SERVER 'cd $DEPLOY_DIR && docker-compose logs'"
fi

echo ""
