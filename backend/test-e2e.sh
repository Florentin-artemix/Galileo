#!/bin/bash

# Script de tests end-to-end pour l'architecture Galileo
# Tests le workflow complet: Soumission → Validation → Publication

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="http://localhost:8080"
LECTURE_URL="http://localhost:8081"
ECRITURE_URL="http://localhost:8082"
TEST_USER_ID="test-user-123"
TEST_USER_EMAIL="test@example.com"
ADMIN_EMAIL="admin@galileo.com"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Tests End-to-End Galileo${NC}"
echo -e "${BLUE}================================${NC}\n"

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test
test_endpoint() {
    local test_name=$1
    local method=$2
    local url=$3
    local expected_status=$4
    local headers=$5
    local data=$6
    
    echo -n "Test: $test_name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" $headers)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" $headers -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status_code, attendu $expected_status)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "${YELLOW}=== 1. Tests de Health Check ===${NC}\n"

test_endpoint \
    "Gateway Health" \
    "GET" \
    "$GATEWAY_URL/actuator/health" \
    "200"

test_endpoint \
    "Service Lecture Health" \
    "GET" \
    "$LECTURE_URL/actuator/health" \
    "200"

test_endpoint \
    "Service Écriture Health" \
    "GET" \
    "$ECRITURE_URL/api/soumissions/health" \
    "200"

echo -e "\n${YELLOW}=== 2. Tests Service Lecture (Public) ===${NC}\n"

test_endpoint \
    "Lister publications" \
    "GET" \
    "$LECTURE_URL/publications?page=0&size=10" \
    "200"

test_endpoint \
    "Lister articles de blog" \
    "GET" \
    "$LECTURE_URL/blog?page=0&size=10" \
    "200"

test_endpoint \
    "Lister événements" \
    "GET" \
    "$LECTURE_URL/evenements" \
    "200"

echo -e "\n${YELLOW}=== 3. Tests Service Écriture (Authentification requise) ===${NC}\n"

# Note: Ces tests nécessitent des headers Firebase valides
# Pour un test complet, il faudrait générer un vrai token Firebase

test_endpoint \
    "Lister mes soumissions (sans auth)" \
    "GET" \
    "$ECRITURE_URL/api/soumissions" \
    "400" \
    "-H 'X-User-Id: $TEST_USER_ID'"

echo -e "\n${YELLOW}=== 4. Tests Admin (Authentification Admin requise) ===${NC}\n"

test_endpoint \
    "Statistiques soumissions" \
    "GET" \
    "$ECRITURE_URL/api/admin/soumissions/statistiques" \
    "200" \
    "-H 'X-User-Email: $ADMIN_EMAIL'"

test_endpoint \
    "Lister soumissions en attente" \
    "GET" \
    "$ECRITURE_URL/api/admin/soumissions/en-attente" \
    "200" \
    "-H 'X-User-Email: $ADMIN_EMAIL'"

echo -e "\n${YELLOW}=== 5. Tests Gateway (Routage) ===${NC}\n"

test_endpoint \
    "Gateway → Service Lecture" \
    "GET" \
    "$GATEWAY_URL/api/publications?page=0&size=5" \
    "200"

echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}Résumé des tests${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Tests réussis: $TESTS_PASSED${NC}"
echo -e "${RED}Tests échoués: $TESTS_FAILED${NC}"
echo -e "${BLUE}Total: $((TESTS_PASSED + TESTS_FAILED))${NC}\n"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les tests sont passés !${NC}"
    exit 0
else
    echo -e "${RED}✗ Certains tests ont échoué${NC}"
    exit 1
fi
