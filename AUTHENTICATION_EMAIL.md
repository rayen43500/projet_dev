# Authentification par Email

## ✅ Modifications Effectuées

Le système d'authentification a été mis à jour pour accepter l'**email** au lieu du nom d'utilisateur.

### Backend

1. **`backend/app/core/security.py`** :
   - Ajout de `authenticate_user_by_email()` : authentifie par email
   - Ajout de `authenticate_user_by_email_or_username()` : accepte email OU username

2. **`backend/app/api/v1/endpoints/auth.py`** :
   - L'endpoint `/api/v1/auth/login` accepte maintenant l'email dans le champ `username`
   - La réponse inclut maintenant le champ `email` en plus de `username`

### Frontend

1. **`frontend/src/contexts/AuthContext.tsx`** :
   - La fonction `login()` accepte maintenant `email` au lieu de `username`

2. **`frontend/src/pages/Auth/Login.tsx`** :
   - Le formulaire utilise maintenant un champ `email` au lieu de `username`
   - Le label et placeholder ont été mis à jour

## 🚀 Utilisation

### Connexion avec Email

Les utilisateurs peuvent maintenant se connecter avec leur **email** :

```typescript
// Dans le frontend
await login('admin@proctoflex.ai', 'password123');
```

### Compatibilité

Le backend accepte **à la fois** l'email et le username pour la rétrocompatibilité :

- ✅ `admin@proctoflex.ai` (email)
- ✅ `admin` (username)

## 📝 Format de la Requête

L'endpoint `/api/v1/auth/login` utilise toujours OAuth2PasswordRequestForm, mais le champ `username` peut maintenant contenir un email :

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@proctoflex.ai&password=password123"
```

## 🔄 Redémarrage Requis

Le backend a été redémarré automatiquement. Si vous modifiez le code backend, redémarrez avec :

```powershell
docker compose restart backend
```

## ✅ Test

Pour tester l'authentification par email :

1. Créez un utilisateur (si pas déjà fait) :
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@proctoflex.ai",
    "password": "admin123",
    "role": "admin"
  }'
```

2. Connectez-vous avec l'email :
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@proctoflex.ai&password=admin123"
```

3. Testez dans le frontend :
   - Ouvrez `http://localhost:3000`
   - Utilisez l'email : `admin@proctoflex.ai`
   - Entrez le mot de passe

## 📌 Notes

- Le token JWT contient toujours le `username` (pas l'email) dans le champ `sub`
- L'email est retourné dans la réponse de login pour information
- Les deux méthodes (email et username) fonctionnent pour la rétrocompatibilité

