#!/bin/bash

# Script pour voir les logs en temps réel

SERVICE=$1

if [ -z "$SERVICE" ]; then
    echo "📋 Logs de tous les services:"
    echo ""
    docker-compose logs -f
else
    echo "📋 Logs du service: $SERVICE"
    echo ""
    docker-compose logs -f $SERVICE
fi
