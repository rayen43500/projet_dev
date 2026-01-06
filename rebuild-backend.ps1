# Script pour reconstruire le backend avec mediapipe
# Le build peut prendre 20-30 minutes a cause de la compilation de dlib

Write-Host "=== Reconstruction de l'image Docker Backend ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "ATTENTION: Ce build peut prendre 20-30 minutes" -ForegroundColor Yellow
Write-Host "   La compilation de 'dlib' (requis par face-recognition) est tres longue." -ForegroundColor Yellow
Write-Host ""
Write-Host "Dependances a installer:" -ForegroundColor Cyan
Write-Host "   - mediapipe (nouveau)" -ForegroundColor White
Write-Host "   - dlib (compilation longue ~20 min)" -ForegroundColor White
Write-Host "   - face-recognition" -ForegroundColor White
Write-Host ""
Write-Host "Astuce: Vous pouvez laisser le build tourner en arriere-plan" -ForegroundColor Green
Write-Host ""

$response = Read-Host "Voulez-vous continuer? (O/N)"

if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Demarrage du build..." -ForegroundColor Green
    Write-Host ""
    
    # Rebuild avec BuildKit pour de meilleures performances
    $env:DOCKER_BUILDKIT=1
    docker compose build backend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Build reussi! Vous pouvez maintenant demarrer les services:" -ForegroundColor Green
        Write-Host "   docker compose up -d" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Le build a echoue. Verifiez les erreurs ci-dessus." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Build annule." -ForegroundColor Yellow
}

