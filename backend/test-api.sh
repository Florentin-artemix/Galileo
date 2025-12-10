#!/bin/bash

# Script de test des endpoints de l'API

echo "=========================================="
echo "  Tests des endpoints Galileo"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8080"

# Test Gateway Health
echo "🏥 Test Gateway Health..."
curl -s $BASE_URL/actuator/health | jq '.' || echo "❌ Gateway inaccessible"
echo ""

# Test Service Lecture Health
echo "🏥 Test Service Lecture Health..."
curl -s http://localhost:8081/actuator/health | jq '.' || echo "❌ Service Lecture inaccessible"
echo ""

# Test Service Écriture Health
echo "🏥 Test Service Écriture Health..."
curl -s http://localhost:8082/actuator/health | jq '.' || echo "❌ Service Écriture inaccessible"
echo ""

# Test Elasticsearch
echo "🏥 Test Elasticsearch..."
curl -s http://localhost:9200/_cluster/health | jq '.' || echo "❌ Elasticsearch inaccessible"
echo ""

# Test Publications endpoint (via Gateway)
echo "📚 Test GET /api/publications..."
curl -s -w "\nStatus: %{http_code}\n" $BASE_URL/api/publications
echo ""

# Test Blog endpoint (via Gateway)
echo "📝 Test GET /api/blog..."
curl -s -w "\nStatus: %{http_code}\n" $BASE_URL/api/blog
echo ""

# Test Événements endpoint (via Gateway)
echo "📅 Test GET /api/evenements..."
curl -s -w "\nStatus: %{http_code}\n" $BASE_URL/api/evenements
echo ""

echo "=========================================="
echo "  Tests terminés"
echo "=========================================="
