# Script PowerShell pour creer un compte administrateur
# Usage: .\create-admin.ps1 [--email EMAIL] [--username USERNAME] [--password PASSWORD]

param(
    [string]$Email = "admin@proctoflex.ai",
    [string]$Username = "admin",
    [string]$Password = "admin123",
    [string]$FullName = "Administrator"
)

Write-Host "=== Creation du compte administrateur ===" -ForegroundColor Cyan
Write-Host ""

# Verifier que le backend est en cours d'execution
Write-Host "[1/3] Verification du backend..." -ForegroundColor Yellow
$backendRunning = docker ps --filter "name=proctoflex-backend" --format "{{.Names}}" | Select-String "proctoflex-backend"

if (-not $backendRunning) {
    Write-Host "ERREUR: Le backend Docker n'est pas en cours d'execution!" -ForegroundColor Red
    Write-Host "Demarrez-le avec: docker compose up -d backend" -ForegroundColor Yellow
    exit 1
}
Write-Host "Backend en cours d'execution." -ForegroundColor Green

# Option 1: Utiliser l'API (recommandé)
Write-Host ""
Write-Host "[2/3] Creation du compte via l'API..." -ForegroundColor Yellow

$body = @{
    email = $Email
    username = $Username
    password = $Password
    full_name = $FullName
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Compte administrateur cree avec succes via l'API!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informations du compte:" -ForegroundColor Cyan
    Write-Host "   Email: $Email" -ForegroundColor White
    Write-Host "   Username: $Username" -ForegroundColor White
    Write-Host "   Password: $Password" -ForegroundColor White
    Write-Host "   Role: admin" -ForegroundColor White
    Write-Host "   User ID: $($response.user_id)" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Vous pouvez maintenant vous connecter avec:" -ForegroundColor Green
    Write-Host "   Email: $Email" -ForegroundColor Yellow
    Write-Host "   Password: $Password" -ForegroundColor Yellow
    
} catch {
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMessage = $errorDetails.detail
        } catch {
            $errorMessage = $_.ErrorDetails.Message
        }
    }
    
    if ($errorMessage -like "*existe deja*" -or $errorMessage -like "*already exists*") {
        Write-Host "⚠️  Un compte avec cet email ou username existe deja." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Utiliser un autre email/username" -ForegroundColor Cyan
        Write-Host "Option 2: Executer le script Python directement dans le conteneur:" -ForegroundColor Cyan
        Write-Host "   docker exec -it proctoflex-backend python /app/scripts/create_admin.py --email $Email --username $Username --password $Password" -ForegroundColor Gray
    } else {
        Write-Host "❌ Erreur lors de la creation du compte: $errorMessage" -ForegroundColor Red
        Write-Host ""
        Write-Host "Essai avec le script Python..." -ForegroundColor Yellow
        
        # Option 2: Utiliser le script Python dans le conteneur
        Write-Host "[3/3] Creation du compte via script Python..." -ForegroundColor Yellow
        
        # Copier le script dans le conteneur si necessaire
        docker exec proctoflex-backend python -c "
from app.core.database import engine, Base, User
from app.core.security import get_password_hash
from app.crud.user import get_user_by_email, get_user_by_username
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)
db = Session(bind=engine)

try:
    if get_user_by_email(db, '$Email') or get_user_by_username(db, '$Username'):
        print('Utilisateur existe deja')
    else:
        user = User(
            email='$Email',
            username='$Username',
            hashed_password=get_password_hash('$Password'),
            full_name='$FullName',
            role='admin',
            is_active=True
        )
        db.add(user)
        db.commit()
        print('Compte cree avec succes')
except Exception as e:
    print(f'Erreur: {e}')
    db.rollback()
finally:
    db.close()
" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Compte cree avec succes!" -ForegroundColor Green
        } else {
            Write-Host "❌ Echec de la creation du compte." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "=== Termine ===" -ForegroundColor Cyan

