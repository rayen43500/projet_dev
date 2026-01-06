# Script de nettoyage Docker pour libérer de l'espace disque
# Run this script as Administrator

Write-Host "=== Nettoyage Docker - Libération d'espace disque ===" -ForegroundColor Cyan

# Vérifier l'espace avant
Write-Host "`n[1/4] Espace disque actuel:" -ForegroundColor Yellow
$diskBefore = Get-PSDrive C
Write-Host "Espace libre: $([math]::Round($diskBefore.Free/1GB, 2)) GB" -ForegroundColor White

# Afficher l'utilisation Docker actuelle
Write-Host "`n[2/4] Utilisation Docker actuelle:" -ForegroundColor Yellow
docker system df

# Nettoyer les ressources Docker inutilisées
Write-Host "`n[3/4] Nettoyage Docker..." -ForegroundColor Yellow
Write-Host "Suppression des images non utilisées, conteneurs arrêtés, et cache de build..." -ForegroundColor Gray

# Nettoyer tout sauf les volumes (pour préserver les données)
docker system prune -a --volumes --force

# Vérifier l'espace après
Write-Host "`n[4/4] Espace disque après nettoyage:" -ForegroundColor Yellow
$diskAfter = Get-PSDrive C
$freed = ($diskAfter.Free - $diskBefore.Free) / 1GB
Write-Host "Espace libre: $([math]::Round($diskAfter.Free/1GB, 2)) GB" -ForegroundColor White
Write-Host "Espace libéré: $([math]::Round($freed, 2)) GB" -ForegroundColor Green

Write-Host "`n=== Nettoyage terminé ===" -ForegroundColor Green
Write-Host "Vous pouvez maintenant reconstruire votre image Docker." -ForegroundColor Cyan

