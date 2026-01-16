# Script de déploiement complet sur le serveur SSH
$SERVER = "root@159.89.156.228"
$BACKEND_DIR = "/opt/galileo/backend"
$FRONTEND_DIR = "/opt/galileo/frontend-src"

Write-Host "=== Étape 1: Installation de Docker (si nécessaire) ===" -ForegroundColor Green
ssh $SERVER "which docker || (curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && systemctl start docker && systemctl enable docker)"

Write-Host "`n=== Étape 2: Construction des images Docker backend ===" -ForegroundColor Green
ssh $SERVER "cd $BACKEND_DIR && for dir in galileo-gateway galileo-lecture galileo-ecriture galileo-user-profile galileo-notification galileo-analytics; do if [ -d \$dir ]; then cd \$dir && docker build -t backend-\${dir#galileo-} . && cd ..; fi; done"

Write-Host "`n=== Étape 3: Démarrage des services backend ===" -ForegroundColor Green
ssh $SERVER "cd $BACKEND_DIR && docker compose up -d"

Write-Host "`n=== Étape 4: Construction de l'image frontend ===" -ForegroundColor Green
ssh $SERVER @"
cd $FRONTEND_DIR && docker build --no-cache \\
  --build-arg VITE_API_URL=/api \\
  --build-arg VITE_FIREBASE_API_KEY=AIzaSyCo-ZpW14aW_QViQz1bjH1M6MmZ6nrKHbA \\
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=galileo-67aeb.firebaseapp.com \\
  --build-arg VITE_FIREBASE_PROJECT_ID=galileo-67aeb \\
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=galileo-67aeb.firebasestorage.app \\
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=305265616892 \\
  --build-arg VITE_FIREBASE_APP_ID=1:305265616892:web:81f47668ed84e2fcd4c9f7 \\
  -t galileo-frontend:latest .
"@

Write-Host "`n=== Étape 5: Démarrage du conteneur frontend ===" -ForegroundColor Green
ssh $SERVER @"
docker stop galileo-frontend 2>/dev/null || true
docker rm galileo-frontend 2>/dev/null || true
docker run -d --name galileo-frontend \\
  --network backend_galileo-network \\
  -p 80:80 \\
  galileo-frontend:latest
"@

Write-Host "`n=== Étape 6: Vérification de l'état des conteneurs ===" -ForegroundColor Green
ssh $SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}'"

Write-Host "`n=== Déploiement terminé ! ===" -ForegroundColor Green
Write-Host "Site accessible sur: http://159.89.156.228" -ForegroundColor Cyan
