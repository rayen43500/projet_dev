# ProctoFlex AI - Système de Surveillance d'Examens

## 🚀 Démarrage Rapide

### 1. Installer les dépendances

```bash
# Backend
cd backend
python install_simple.py

# Frontend  
cd frontend
npm install

# Desktop
cd desktop
npm install
```

### 2. Démarrer les services

**Option A : Script automatique**
```bash
start_all_services.bat
```

**Option B : Manuel**
```bash
# Backend (Terminal 1)
cd backend
python main_simple.py

# Frontend (Terminal 2)  
cd frontend
npm run dev

# Desktop (Terminal 3)
cd desktop
npm run dev
```

## 📍 URLs

- **Backend API** : http://localhost:8000
- **Frontend Admin** : http://localhost:3000
- **Desktop App** : Application Electron

## 🛠️ Scripts Utiles

- `start_all_services.bat` - Démarre tout
- `start_frontend.bat` - Frontend seulement
- `start_backend.bat` - Backend seulement

## 📁 Structure

```
├── backend/     # API FastAPI + AI
├── frontend/    # Interface Admin React
├── desktop/     # App Electron
└── docs/        # Documentation
```

## 🔧 Dépannage

**Erreur de dépendances** : Relancer `npm install` ou `python install_simple.py`

**Port occupé** : Vérifier qu'aucun autre service n'utilise les ports 8000/3000

**Cache Vite** : Supprimer `frontend/node_modules/.vite` et redémarrer
