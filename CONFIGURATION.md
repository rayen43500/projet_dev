# Configuration Frontend et Desktop

Ce guide explique comment configurer le frontend et le desktop pour utiliser le backend Docker et la base de données.

## 📋 Prérequis

- Docker Desktop en cours d'exécution
- Backend démarré avec `docker compose up -d backend`
- Base de données PostgreSQL accessible sur `localhost:5432`

## 🔧 Configuration Frontend

### Variables d'environnement

Le frontend utilise Vite, donc les variables d'environnement doivent commencer par `VITE_`.

1. **Créer le fichier `.env` dans le dossier `frontend/`** :

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

2. **Si le frontend tourne dans Docker**, les variables sont déjà configurées dans `docker-compose.yml`.

### Structure de l'API

Le frontend utilise un service API centralisé (`src/services/api.ts`) qui :
- Gère automatiquement l'authentification (tokens JWT)
- Centralise tous les appels API
- Gère les erreurs de manière uniforme

### Utilisation

```typescript
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

// Exemple: Login
const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
  username: 'admin',
  password: 'password'
});

// Exemple: GET request
const response = await apiService.get(API_ENDPOINTS.USERS.LIST);
```

## 🖥️ Configuration Desktop

### Variables d'environnement

1. **Créer le fichier `.env` dans le dossier `desktop/`** :

```env
API_URL=http://localhost:8000
WS_URL=ws://localhost:8000
```

2. **Ou définir dans le code** (voir `desktop/src/config/api.ts`)

### Connexion au Backend

Le desktop Electron peut accéder directement au backend via `localhost:8000` car il tourne sur la machine hôte, pas dans un conteneur Docker.

## 🗄️ Configuration Base de Données

### Accès depuis le Frontend/Desktop

Le frontend et le desktop **ne se connectent pas directement** à la base de données. Ils passent toujours par l'API Backend.

### Accès depuis le Backend

Le backend se connecte à PostgreSQL via la variable d'environnement `DATABASE_URL` :

```env
DATABASE_URL=postgresql://proctoflex:proctoflex_password@postgres:5432/proctoflex
```

Cette configuration est déjà définie dans `docker-compose.yml`.

## 🚀 Démarrage

### 1. Démarrer le Backend et la Base de Données

```powershell
docker compose up -d postgres redis backend
```

### 2. Démarrer le Frontend

**Option A: Avec Docker**
```powershell
docker compose up -d frontend
```

**Option B: En développement local**
```powershell
cd frontend
npm install
npm run dev
```

### 3. Démarrer le Desktop

```powershell
cd desktop
npm install
npm run dev
```

## 🔍 Vérification

### Vérifier que le Backend fonctionne

```powershell
curl http://localhost:8000/health
```

Devrait retourner :
```json
{"status":"healthy","service":"ProctoFlex AI Backend","version":"1.0.0"}
```

### Vérifier la connexion à la base de données

```powershell
docker exec proctoflex-postgres psql -U proctoflex -d proctoflex -c "SELECT version();"
```

## 📝 Notes Importantes

1. **URLs dans Docker** : Si le frontend tourne dans Docker, utilisez `http://backend:8000` au lieu de `http://localhost:8000` pour les communications inter-conteneurs.

2. **CORS** : Le backend est configuré pour accepter les requêtes depuis :
   - `http://localhost:3000` (Frontend)
   - `http://localhost:5173` (Desktop Vite dev server)
   - `http://localhost:8080` (Client Electron)

3. **Authentification** : Les tokens JWT sont stockés dans `localStorage` et automatiquement inclus dans les requêtes.

## 🐛 Dépannage

### Le frontend ne peut pas se connecter au backend

1. Vérifiez que le backend est démarré : `docker compose ps`
2. Vérifiez l'URL dans `.env` : doit être `http://localhost:8000`
3. Vérifiez les logs du backend : `docker logs proctoflex-backend`

### Erreur CORS

Vérifiez que l'origine est autorisée dans `backend/app/core/config.py` :
```python
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
]
```

### La base de données n'est pas accessible

1. Vérifiez que PostgreSQL est démarré : `docker compose ps postgres`
2. Vérifiez les logs : `docker logs proctoflex-postgres`
3. Vérifiez la variable `DATABASE_URL` dans `docker-compose.yml`

