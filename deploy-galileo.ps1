# Script de déploiement Galileo sur 138.197.37.154
$ErrorActionPreference = "Stop"

$SERVER = "root@138.197.37.154"
$DEPLOY_DIR = "/opt/galileo"

Write-Host "=== Déploiement Galileo ===" -ForegroundColor Cyan

# 1. Vérifier le contenu actuel
Write-Host "`n[1] Vérification du serveur..." -ForegroundColor Yellow
ssh $SERVER "ls -la $DEPLOY_DIR/"

# 2. Créer l'archive du projet
Write-Host "`n[2] Création de l'archive..." -ForegroundColor Yellow
$backendPath = "C:\Users\NERIA FLORENTIN\Downloads\Galileo\Galileo\backend"
$archivePath = "C:\Users\NERIA FLORENTIN\Downloads\Galileo\Galileo\galileo-backend.zip"

if (Test-Path $archivePath) { Remove-Item $archivePath -Force }
Compress-Archive -Path "$backendPath\*" -DestinationPath $archivePath -Force
Write-Host "Archive créée: $archivePath"

# 3. Transférer l'archive
Write-Host "`n[3] Transfert de l'archive..." -ForegroundColor Yellow
scp $archivePath "${SERVER}:${DEPLOY_DIR}/"

# 4. Extraire sur le serveur
Write-Host "`n[4] Extraction et préparation..." -ForegroundColor Yellow
ssh $SERVER "cd $DEPLOY_DIR && apt-get install -y unzip && rm -rf backend && mkdir -p backend && unzip -o galileo-backend.zip -d backend/ && rm galileo-backend.zip && ls -la backend/"

# 5. Créer le fichier firebase-credentials.json
Write-Host "`n[5] Configuration Firebase..." -ForegroundColor Yellow
$firebasePath = "C:\Users\NERIA FLORENTIN\Downloads\Galileo\Galileo\galileo-67aeb-firebase-adminsdk-fbsvc-0f837b7caa.json"
if (Test-Path $firebasePath) {
    scp $firebasePath "${SERVER}:${DEPLOY_DIR}/backend/config/firebase-credentials.json"
    Write-Host "Firebase credentials transférées"
}

# 6. Lancer Docker Compose
Write-Host "`n[6] Démarrage des services Docker..." -ForegroundColor Yellow
ssh $SERVER "cd ${DEPLOY_DIR}/backend && docker compose up -d --build"

# 7. Vérifier les conteneurs
Write-Host "`n[7] État des conteneurs..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
ssh $SERVER "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

Write-Host "`n=== Déploiement terminé ===" -ForegroundColor Green
