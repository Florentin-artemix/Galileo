#!/bin/bash

# Script de visualisation des logs pour tous les services Galileo
# Usage: ./logs-watch.sh [service]
# Services disponibles: gateway, lecture, ecriture, all

SERVICE=${1:-all}

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

case $SERVICE in
    gateway)
        echo -e "${GREEN}=== Logs Gateway ===${NC}"
        tail -f /tmp/galileo-gateway.log
        ;;
    lecture)
        echo -e "${BLUE}=== Logs Service Lecture ===${NC}"
        tail -f /tmp/galileo-lecture.log
        ;;
    ecriture)
        echo -e "${CYAN}=== Logs Service Écriture ===${NC}"
        tail -f /tmp/galileo-ecriture.log
        ;;
    all)
        echo -e "${YELLOW}=== Logs de tous les services ===${NC}"
        echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter${NC}\n"
        
        # Utiliser multitail si disponible, sinon tail avec préfixes
        if command -v multitail &> /dev/null; then
            multitail -c \
                -s 3 \
                -l "tail -f /tmp/galileo-gateway.log" \
                -l "tail -f /tmp/galileo-lecture.log" \
                -l "tail -f /tmp/galileo-ecriture.log"
        else
            # Solution alternative avec tail et des couleurs
            tail -f \
                /tmp/galileo-gateway.log \
                /tmp/galileo-lecture.log \
                /tmp/galileo-ecriture.log \
                2>/dev/null | while IFS= read -r line; do
                    if [[ "$line" == "==>"* ]]; then
                        if [[ "$line" == *"gateway"* ]]; then
                            echo -e "${GREEN}$line${NC}"
                        elif [[ "$line" == *"lecture"* ]]; then
                            echo -e "${BLUE}$line${NC}"
                        elif [[ "$line" == *"ecriture"* ]]; then
                            echo -e "${CYAN}$line${NC}"
                        fi
                    else
                        echo "$line"
                    fi
                done
        fi
        ;;
    *)
        echo -e "${RED}Service invalide: $SERVICE${NC}"
        echo "Usage: $0 [gateway|lecture|ecriture|all]"
        exit 1
        ;;
esac
