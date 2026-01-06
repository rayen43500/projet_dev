# Guide de démarrage du Backend

## ❌ Erreur actuelle
```
ERR_CONNECTION_REFUSED - Le backend n'est pas démarré
```

## ✅ Solution : Démarrer le backend

### Option 1 : Démarrer avec Python (Recommandé)

1. **Ouvrir un terminal dans le dossier backend**
   ```bash
   cd backend
   ```

2. **Vérifier que Python est installé**
   ```bash
   python --version
   # ou
   python3 --version
   ```

3. **Installer les dépendances (si pas déjà fait)**
   ```bash
   pip install -r requirements.txt
   ```

4. **Démarrer le serveur**
   ```bash
   python main.py
   ```

   Vous devriez voir :
   ```
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
   ```

### Option 2 : Démarrer avec Uvicorn directement

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 3 : Démarrer en arrière-plan (Windows PowerShell)

```powershell
cd backend
Start-Process python -ArgumentList "main.py" -WindowStyle Hidden
```

## 🔍 Vérifier que le backend fonctionne

1. **Ouvrir dans le navigateur** :
   - http://localhost:8000
   - Vous devriez voir : `{"message":"Bienvenue sur ProctoFlex AI API",...}`

2. **Vérifier la documentation** :
   - http://localhost:8000/docs
   - Interface Swagger UI devrait s'afficher

3. **Vérifier le health check** :
   - http://localhost:8000/health
   - Devrait retourner : `{"status":"healthy",...}`

## 🐛 Problèmes courants

### Port 8000 déjà utilisé

**Solution 1 : Trouver et arrêter le processus**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Solution 2 : Changer le port dans main.py**
```python
uvicorn.run(
    "main:app",
    host="0.0.0.0",
    port=8001,  # Changer ici
    reload=True,
    log_level="info"
)
```

Et mettre à jour `frontend/src/config/api.ts` :
```typescript
export const API_BASE_URL = 'http://localhost:8001';
```

### Erreur "Module not found"

Installez les dépendances :
```bash
cd backend
pip install -r requirements.txt
```

### Erreur de base de données

Vérifiez que la base de données est configurée dans `.env` ou `app/core/config.py`

### Le backend démarre mais se ferme immédiatement

Vérifiez les logs d'erreur dans le terminal. Les erreurs courantes :
- Problème d'import de modules
- Problème de connexion à la base de données
- Port déjà utilisé

## 📝 Script de démarrage rapide (Windows)

Créez un fichier `start_backend.bat` dans le dossier backend :

```bat
@echo off
echo Démarrage du backend ProctoFlex AI...
cd /d %~dp0
python main.py
pause
```

Double-cliquez sur `start_backend.bat` pour démarrer.

## 📝 Script de démarrage rapide (Linux/Mac)

Créez un fichier `start_backend.sh` dans le dossier backend :

```bash
#!/bin/bash
echo "Démarrage du backend ProctoFlex AI..."
cd "$(dirname "$0")"
python3 main.py
```

Rendez-le exécutable :
```bash
chmod +x start_backend.sh
./start_backend.sh
```

## ✅ Une fois le backend démarré

1. Le backend devrait être accessible sur http://localhost:8000
2. Vous pouvez maintenant vous connecter depuis le frontend
3. Les erreurs `ERR_CONNECTION_REFUSED` devraient disparaître

## 🔄 Redémarrage automatique

Avec `reload=True` dans main.py, le serveur redémarre automatiquement lors des modifications de code.

