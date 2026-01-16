# Script de déploiement Galileo pour Windows PowerShell

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "GALILEO - Script de Déploiement" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "root@143.110.132.26"
$DEPLOY_DIR = "/opt/galileo"

Write-Host "[1/5] Vérification de la connexion au serveur..." -ForegroundColor Yellow
try {
    ssh $SERVER "echo 'Connexion OK'" | Out-Null
    Write-Host "✓ Connexion établie" -ForegroundColor Green
} catch {
    Write-Host "✗ Impossible de se connecter au serveur" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/5] Vérification des fichiers de configuration..." -ForegroundColor Yellow
$configCheck = ssh $SERVER "test -f $DEPLOY_DIR/.env && test -f $DEPLOY_DIR/backend/galileo-gateway/config/firebase-credentials.json && echo 'OK' || echo 'MISSING'"
if ($configCheck -match "OK") {
    Write-Host "✓ Fichiers de configuration présents" -ForegroundColor Green
} else {
    Write-Host "✗ Fichiers de configuration manquants" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/5] Arrêt des conteneurs existants..." -ForegroundColor Yellow
ssh $SERVER "cd $DEPLOY_DIR && docker-compose down" 2>&1 | Out-Null
Write-Host "✓ Conteneurs arrêtés" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Construction et démarrage des services (cela peut prendre 5-10 minutes)..." -ForegroundColor Yellow
Write-Host "Veuillez patienter..." -ForegroundColor Yellow
ssh $SERVER "cd $DEPLOY_DIR && docker-compose up -d --build 2>&1"

Write-Host ""
Write-Host "[5/5] Vérification de l'état des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "État des conteneurs:" -ForegroundColor Cyan
ssh $SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "DÉPLOIEMENT TERMINÉ!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Accès à l'application:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://143.110.132.26:3000" -ForegroundColor White
Write-Host "  - API Gateway: http://143.110.132.26:8080" -ForegroundColor White
Write-Host "  - Elasticsearch: http://143.110.132.26:9200" -ForegroundColor White
Write-Host ""
Write-Host "Commandes utiles:" -ForegroundColor Cyan
Write-Host "  - Voir les logs: ssh $SERVER 'cd $DEPLOY_DIR && docker-compose logs -f'" -ForegroundColor White
Write-Host "  - Redémarrer: ssh $SERVER 'cd $DEPLOY_DIR && docker-compose restart'" -ForegroundColor White
Write-Host "  - Arrêter: ssh $SERVER 'cd $DEPLOY_DIR && docker-compose down'" -ForegroundColor White
Write-Host ""
