# Guide de Configuration Frontend et Desktop

## ✅ Configuration Terminée

Les fichiers suivants ont été créés/modifiés pour connecter le frontend et le desktop au backend Docker :

### Frontend

1. **`frontend/src/config/api.ts`** - Configuration des URLs et endpoints API
2. **`frontend/src/services/api.ts`** - Service API centralisé avec gestion d'authentification
3. **`frontend/src/contexts/AuthContext.tsx`** - Mise à jour pour utiliser le vrai backend
4. **`frontend/src/pages/Auth/Login.tsx`** - Mise à jour pour utiliser username au lieu de email

### Desktop

1. **`desktop/src/config/api.ts`** - Configuration API pour le desktop

### Docker

1. **`docker-compose.yml`** - Mise à jour des variables d'environnement (VITE_API_URL au lieu de REACT_APP_API_URL)

## 🚀 Prochaines Étapes

### 1. Créer les fichiers .env

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

**Desktop** (`desktop/.env`):
```env
API_URL=http://localhost:8000
WS_URL=ws://localhost:8000
```

### 2. Démarrer les services

```powershell
# Démarrer backend, postgres et redis
docker compose up -d postgres redis backend

# Vérifier que tout fonctionne
docker compose ps
curl http://localhost:8000/health
```

### 3. Tester le Frontend

```powershell
cd frontend
npm install
npm run dev
```

Ouvrez `http://localhost:3000` et testez la connexion.

### 4. Tester le Desktop

```powershell
cd desktop
npm install
npm run dev
```

## 📝 Notes Importantes

1. **Authentification** : Le backend utilise OAuth2PasswordRequestForm qui attend `username` et `password` (pas `email`).

2. **Tokens JWT** : Les tokens sont automatiquement stockés dans `localStorage` et inclus dans toutes les requêtes.

3. **CORS** : Le backend accepte les requêtes depuis :
   - `http://localhost:3000` (Frontend)
   - `http://localhost:5173` (Desktop Vite)
   - `http://localhost:8080` (Electron)

4. **Base de données** : Le frontend/desktop ne se connecte PAS directement à la DB. Tout passe par l'API backend.

## 🔍 Vérification

### Test de connexion API

```typescript
// Dans le frontend, testez :
import { apiService } from './services/api';
import { API_ENDPOINTS } from './config/api';

// Test health check
const health = await apiService.get(API_ENDPOINTS.HEALTH);
console.log(health);
```

### Test de login

Utilisez les identifiants créés dans votre base de données. Si vous n'avez pas encore d'utilisateur, créez-en un via l'API :

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@test.com","password":"admin123","role":"admin"}'
```

Puis connectez-vous avec ces identifiants dans le frontend.

## 📚 Documentation Complète

Voir `CONFIGURATION.md` pour plus de détails.

