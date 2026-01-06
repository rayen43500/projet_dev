# Script simple pour creer un compte admin via l'API
param(
    [string]$Email = "admin@proctoflex.ai",
    [string]$Username = "admin",
    [string]$Password = "admin123"
)

Write-Host "Creation du compte administrateur..." -ForegroundColor Cyan

$body = @{
    email = $Email
    username = $Username
    password = $Password
    full_name = "Administrator"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Compte cree avec succes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informations:" -ForegroundColor Yellow
    Write-Host "  Email: $Email" -ForegroundColor White
    Write-Host "  Username: $Username" -ForegroundColor White
    Write-Host "  Password: $Password" -ForegroundColor White
    Write-Host "  Token: $($response.access_token)" -ForegroundColor Gray
    
} catch {
    $errorDetails = $_.ErrorDetails.Message
    if ($errorDetails) {
        try {
            $jsonError = $errorDetails | ConvertFrom-Json
            if ($jsonError.detail -like "*existe deja*" -or $jsonError.detail -like "*already exists*") {
                Write-Host "⚠️  Un compte avec cet email/username existe deja." -ForegroundColor Yellow
                Write-Host "   Vous pouvez vous connecter avec:" -ForegroundColor Cyan
                Write-Host "   Email: $Email" -ForegroundColor White
                Write-Host "   Password: $Password" -ForegroundColor White
            } else {
                Write-Host "❌ Erreur: $($jsonError.detail)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Erreur: $errorDetails" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}

