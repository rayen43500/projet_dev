# Script pour corriger les problemes de certificat Docker
# Run this script as Administrator

Write-Host "=== Correction des problemes de certificat Docker ===" -ForegroundColor Cyan
Write-Host ""

# Verifier si Docker Desktop est en cours d'execution
Write-Host "[1/5] Verification de Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Docker Desktop n'est pas en cours d'execution!" -ForegroundColor Red
    Write-Host "Veuillez demarrer Docker Desktop et reessayer." -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker Desktop est en cours d'execution." -ForegroundColor Green

# Solution 1: Redemarrer Docker Desktop
Write-Host ""
Write-Host "[2/5] Redemarrage de Docker Desktop..." -ForegroundColor Yellow
Write-Host "Veuillez arreter Docker Desktop manuellement (clic droit sur l'icone > Quit Docker Desktop)" -ForegroundColor Yellow
Write-Host "Puis redemarrez-le apres 10 secondes." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Solution 2: Nettoyer le cache Docker
Write-Host ""
Write-Host "[3/5] Nettoyage du cache Docker..." -ForegroundColor Yellow
docker builder prune -f 2>&1 | Out-Null
Write-Host "Cache nettoye." -ForegroundColor Green

# Solution 3: Verifier les parametres Docker Desktop
Write-Host ""
Write-Host "[4/5] Verifications des parametres Docker Desktop:" -ForegroundColor Yellow
Write-Host "- Ouvrez Docker Desktop" -ForegroundColor White
Write-Host "- Allez dans Settings > Docker Engine" -ForegroundColor White
Write-Host "- Verifiez qu'il n'y a pas de configuration 'insecure-registries' incorrecte" -ForegroundColor White
Write-Host "- Si vous etes derriere un proxy d'entreprise, configurez-le dans Settings > Resources > Proxies" -ForegroundColor White

# Solution 4: Reessayer avec une image locale si disponible
Write-Host ""
Write-Host "[5/5] Solutions alternatives:" -ForegroundColor Yellow
Write-Host "1. Si vous etes derriere un proxy d'entreprise:" -ForegroundColor White
Write-Host "   - Configurez le proxy dans Docker Desktop Settings > Resources > Proxies" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Si vous avez un antivirus/firewall:" -ForegroundColor White
Write-Host "   - Ajoutez Docker Desktop aux exceptions" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Reessayer le build:" -ForegroundColor White
Write-Host "   docker compose build backend" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== Instructions terminees ===" -ForegroundColor Green
Write-Host "Redemarrez Docker Desktop et reessayez le build." -ForegroundColor Cyan

