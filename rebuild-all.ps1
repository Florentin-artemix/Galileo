# Script pour rebuild tous les conteneurs Docker et redémarrer les services
# Usage: .\rebuild-all.ps1

Write-Host "🔨 Rebuild complet de tous les conteneurs Docker Galileo..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si Docker est en cours d'exécution
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker est en cours d'exécution" -ForegroundColor Green
Write-Host ""

# Arrêter tous les conteneurs
Write-Host "⏹️  Arrêt de tous les conteneurs..." -ForegroundColor Yellow
docker-compose stop
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Certains conteneurs n'étaient pas en cours d'exécution (normal)" -ForegroundColor Yellow
}
Write-Host ""

# Supprimer tous les conteneurs
Write-Host "🗑️  Suppression de tous les conteneurs..." -ForegroundColor Yellow
docker-compose rm -f
Write-Host ""

# Rebuild toutes les images (sans cache pour forcer le rebuild complet)
Write-Host "🔨 Rebuild de toutes les images Docker (cela peut prendre plusieurs minutes)..." -ForegroundColor Cyan
Write-Host "   - Frontend (React)" -ForegroundColor Gray
Write-Host "   - Gateway (Spring Boot)" -ForegroundColor Gray
Write-Host "   - Service Lecture (Spring Boot)" -ForegroundColor Gray
Write-Host "   - Service Écriture (Spring Boot)" -ForegroundColor Gray
Write-Host ""

docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build des images Docker" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build terminé avec succès!" -ForegroundColor Green
Write-Host ""

# Démarrer tous les services
Write-Host "🚀 Démarrage de tous les services..." -ForegroundColor Green
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du démarrage des services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Attente du démarrage des services (30 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Vérifier l'état de tous les conteneurs
Write-Host ""
Write-Host "📊 État de tous les conteneurs:" -ForegroundColor Cyan
Write-Host ""
docker-compose ps

Write-Host ""
Write-Host "📋 Vérification des health checks..." -ForegroundColor Cyan
$containers = docker-compose ps --format json | ConvertFrom-Json
foreach ($container in $containers) {
    $status = $container.State
    $name = $container.Name
    if ($status -eq "running") {
        Write-Host "   ✅ $name : $status" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $name : $status" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 Derniers logs de tous les services:" -ForegroundColor Cyan
Write-Host ""
docker-compose logs --tail=10

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Rebuild et redémarrage terminés!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Liens de test:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://164.92.182.253:3000" -ForegroundColor White
Write-Host "   - Page d'authentification: http://164.92.182.253:3000/#/auth" -ForegroundColor White
Write-Host "   - API Gateway: http://164.92.182.253:8080" -ForegroundColor White
Write-Host "   - Service Lecture: http://164.92.182.253:8081" -ForegroundColor White
Write-Host "   - Service Écriture: http://164.92.182.253:8082" -ForegroundColor White
Write-Host ""
Write-Host "📝 Pour voir les logs en temps réel:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Pour voir les logs d'un service spécifique:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f frontend" -ForegroundColor Gray
Write-Host "   docker-compose logs -f gateway" -ForegroundColor Gray
Write-Host ""





