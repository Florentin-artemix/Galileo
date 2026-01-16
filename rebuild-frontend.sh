#!/bin/bash
# Script pour rebuilder le frontend sur le serveur

cd /opt/galileo/frontend-src

# Installer Node.js si nécessaire
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Installer les dépendances
npm ci

# Build
npm run build

# Copier les fichiers build dans le conteneur
docker cp dist/. galileo-frontend:/usr/share/nginx/html/

# Redémarrer nginx pour prendre en compte les nouveaux fichiers
docker exec galileo-frontend nginx -s reload

echo "Frontend mis à jour avec succès !"
