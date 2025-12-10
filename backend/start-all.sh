#!/bin/bash

# Script de démarrage pour tous les services Galileo
# Usage: ./start-all.sh

set -e

echo "================================"
echo "Démarrage des services Galileo"
echo "================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour vérifier si un service est prêt
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Attente du service $service_name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name est prêt${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ Timeout: $service_name n'a pas démarré${NC}"
    return 1
}

# Démarrer les services avec Docker Compose
echo -e "${YELLOW}Démarrage des services Docker (PostgreSQL, Elasticsearch)...${NC}"
cd /workspaces/Galileo/backend
docker-compose up -d

# Attendre que PostgreSQL soit prêt
echo -e "${YELLOW}Attente de PostgreSQL...${NC}"
sleep 10

# Vérifier les bases de données
echo -e "${YELLOW}Vérification des bases de données...${NC}"
docker exec -it db-lecture psql -U galileo -d db_galileo_lecture -c "SELECT 1;" > /dev/null 2>&1 && \
    echo -e "${GREEN}✓ db_galileo_lecture OK${NC}" || \
    echo -e "${RED}✗ db_galileo_lecture KO${NC}"

docker exec -it db-ecriture psql -U galileo -d db_galileo_ecriture -c "SELECT 1;" > /dev/null 2>&1 && \
    echo -e "${GREEN}✓ db_galileo_ecriture OK${NC}" || \
    echo -e "${RED}✗ db_galileo_ecriture KO${NC}"

# Compiler tous les services
echo -e "\n${YELLOW}Compilation des services Java...${NC}"

echo "Compilation du Gateway..."
cd /workspaces/Galileo/backend/galileo-gateway
mvn clean package -DskipTests

echo "Compilation du Service Lecture..."
cd /workspaces/Galileo/backend/galileo-lecture
mvn clean package -DskipTests

echo "Compilation du Service Écriture..."
cd /workspaces/Galileo/backend/galileo-ecriture
mvn clean package -DskipTests

# Démarrer le Gateway
echo -e "\n${YELLOW}Démarrage du Gateway (port 8080)...${NC}"
cd /workspaces/Galileo/backend/galileo-gateway
java -jar target/*.jar > /tmp/galileo-gateway.log 2>&1 &
GATEWAY_PID=$!
echo "PID Gateway: $GATEWAY_PID"

# Démarrer le Service Lecture
echo -e "${YELLOW}Démarrage du Service Lecture (port 8081)...${NC}"
cd /workspaces/Galileo/backend/galileo-lecture
java -jar target/*.jar > /tmp/galileo-lecture.log 2>&1 &
LECTURE_PID=$!
echo "PID Service Lecture: $LECTURE_PID"

# Démarrer le Service Écriture
echo -e "${YELLOW}Démarrage du Service Écriture (port 8082)...${NC}"
cd /workspaces/Galileo/backend/galileo-ecriture
java -jar target/*.jar > /tmp/galileo-ecriture.log 2>&1 &
ECRITURE_PID=$!
echo "PID Service Écriture: $ECRITURE_PID"

# Vérifier que les services démarrent
echo -e "\n${YELLOW}Vérification du démarrage des services...${NC}"

check_service "Gateway" "http://localhost:8080/actuator/health" || exit 1
check_service "Service Lecture" "http://localhost:8081/actuator/health" || exit 1
check_service "Service Écriture" "http://localhost:8082/api/soumissions/health" || exit 1

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Tous les services sont démarrés !${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\nServices disponibles:"
echo "  - Gateway:          http://localhost:8080"
echo "  - Service Lecture:  http://localhost:8081"
echo "  - Service Écriture: http://localhost:8082"
echo ""
echo "Logs:"
echo "  - Gateway:          tail -f /tmp/galileo-gateway.log"
echo "  - Service Lecture:  tail -f /tmp/galileo-lecture.log"
echo "  - Service Écriture: tail -f /tmp/galileo-ecriture.log"
echo ""
echo "Pour arrêter tous les services: ./stop-all.sh"
echo ""

# Sauvegarder les PIDs
echo "$GATEWAY_PID" > /tmp/galileo-gateway.pid
echo "$LECTURE_PID" > /tmp/galileo-lecture.pid
echo "$ECRITURE_PID" > /tmp/galileo-ecriture.pid

echo -e "${GREEN}PIDs sauvegardés dans /tmp/galileo-*.pid${NC}"
