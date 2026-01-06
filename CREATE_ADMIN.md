# Création du Compte Administrateur

## ✅ Compte Admin Créé

Le compte administrateur a été créé avec succès !

### Informations de Connexion

- **Email**: `admin@proctoflex.ai`
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

## 🔐 Connexion

### Via le Frontend

1. Ouvrez `http://localhost:3000`
2. Utilisez les identifiants :
   - Email: `admin@proctoflex.ai`
   - Password: `admin123`

### Via l'API

```powershell
$formData = "username=admin@proctoflex.ai&password=admin123"
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $formData
```

### Via curl

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@proctoflex.ai&password=admin123"
```

## 📝 Scripts Disponibles

### Créer un autre compte admin

```powershell
.\create-admin-simple.ps1 -Email "autre@email.com" -Username "autre" -Password "password123"
```

### Créer via l'API directement

```powershell
$body = @{
    email = "admin2@proctoflex.ai"
    username = "admin2"
    password = "admin123"
    full_name = "Admin 2"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## ⚠️ Sécurité

**IMPORTANT**: Changez le mot de passe par défaut en production !

Pour changer le mot de passe, vous devrez :
1. Vous connecter avec le compte admin
2. Utiliser l'endpoint de mise à jour de profil (à implémenter)
3. Ou modifier directement dans la base de données

## 🔍 Vérification

Pour vérifier que le compte existe :

```powershell
# Tester la connexion
$formData = "username=admin@proctoflex.ai&password=admin123"
$result = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $formData

Write-Host "✅ Connexion réussie!"
Write-Host "User ID: $($result.user_id)"
Write-Host "Username: $($result.username)"
Write-Host "Role: $($result.role)"
```

