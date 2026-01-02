#!/bin/bash
cd /workspaces/Galileo/backend
docker compose build ecriture userprofile
docker compose up -d ecriture userprofile
