# Fix Docker WSL Connection Issues
# Run this script as Administrator

Write-Host "=== Fixing Docker WSL Connection Issues ===" -ForegroundColor Cyan

# Step 1: Stop Docker Desktop gracefully
Write-Host "`n[1/5] Stopping Docker Desktop..." -ForegroundColor Yellow
Get-Process "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Step 2: Shutdown WSL completely
Write-Host "[2/5] Shutting down WSL..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5

# Step 3: Restart WSL service (if available)
Write-Host "[3/5] Checking WSL service..." -ForegroundColor Yellow
$wslService = Get-Service -Name "LxssManager" -ErrorAction SilentlyContinue
if ($wslService) {
    Write-Host "Restarting LxssManager service..." -ForegroundColor Yellow
    Restart-Service -Name "LxssManager" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
} else {
    Write-Host "LxssManager service not found (this is normal on newer Windows versions)" -ForegroundColor Gray
    Write-Host "WSL is managed differently on this system. Continuing..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

# Step 4: Check WSL status
Write-Host "[4/5] Checking WSL status..." -ForegroundColor Yellow
wsl --status
Write-Host "`nWSL Distributions:" -ForegroundColor Cyan
wsl --list --verbose

# Step 5: Increase Docker resources (if needed)
Write-Host "`n[5/5] Recommendations:" -ForegroundColor Yellow
Write-Host "- Ensure Docker Desktop has at least 4GB RAM allocated" -ForegroundColor White
Write-Host "- Ensure Docker Desktop has at least 60GB disk space" -ForegroundColor White
Write-Host "- Check Docker Desktop Settings > Resources" -ForegroundColor White

Write-Host "`n=== Fix Complete ===" -ForegroundColor Green
Write-Host "Now restart Docker Desktop and try building again." -ForegroundColor Cyan

