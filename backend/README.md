# ProctoFlex AI - Backend

Backend FastAPI pour la plateforme de surveillance intelligente d'examens en ligne.

## 🚀 Démarrage Rapide

### Option 1: Installation Automatique (Recommandée)
```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Exécuter le script d'installation (détecte automatiquement Windows/Linux)
python install.py

# 3. Tester l'installation
python test_installation.py

# 4. Démarrer le serveur
python start.py
```

### Option 1b: Installation Windows Spécifique (Si l'installation standard échoue)
```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Exécuter le script d'installation Windows
python install_windows.py

# 3. Tester l'installation basique
python test_basic.py

# 4. Démarrer le serveur
python start.py
```

### Option 2: Installation Manuelle
```bash
# 1. Créer un environnement virtuel
python -m venv venv

# 2. Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Créer le fichier .env (voir section Configuration)
# 5. Démarrer le serveur
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📦 Dépendances

### Dépendances Principales
- **FastAPI** - Framework web moderne
- **SQLAlchemy** - ORM pour base de données
- **PostgreSQL** - Base de données principale
- **OpenCV** - Traitement d'images et vidéos
- **MediaPipe** - Détection et analyse faciale
- **Face Recognition** - Reconnaissance faciale

### Versions Recommandées
- **Python**: 3.9+
- **MediaPipe**: >=0.10.8 (version stable)
- **OpenCV**: >=4.8.0
- **NumPy**: >=1.24.0

## 🔧 Configuration

### Variables d'Environnement (.env)
```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/proctoflex

# Sécurité
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Serveur
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

### Base de Données
```bash
# Créer la base de données
createdb proctoflex

# Appliquer les migrations
alembic upgrade head
```

## 🛠️ Scripts Disponibles

- `python install.py` - Installation automatique
- `python start.py` - Démarrage du serveur
- `python -m pytest` - Exécuter les tests
- `alembic upgrade head` - Appliquer les migrations
- `alembic revision --autogenerate -m "description"` - Créer une migration

## 📁 Structure du Projet

```
backend/
├── app/
│   ├── api/           # Endpoints API
│   ├── core/          # Configuration et base
│   ├── crud/          # Opérations CRUD
│   ├── models/        # Modèles de données
│   └── ai/            # Modules IA
├── requirements.txt    # Dépendances principales
├── requirements-dev.txt # Dépendances de développement
├── requirements-minimal.txt # Dépendances minimales
├── install.py         # Script d'installation
├── start.py           # Script de démarrage
└── main.py            # Point d'entrée
```

## 🔒 Sécurité

- **JWT** pour l'authentification
- **Bcrypt** pour le hachage des mots de passe
- **CORS** configuré
- **Validation** des données avec Pydantic
- **Isolation** des contextes

## 🧪 Tests

```bash
# Installer les dépendances de test
pip install -r requirements-dev.txt

# Exécuter tous les tests
pytest

# Exécuter avec couverture
pytest --cov=app

# Exécuter un test spécifique
pytest tests/test_auth.py
```

## 🚨 Dépannage

### Compatibilité Windows
Sur Windows, MediaPipe peut poser des problèmes. Le script d'installation utilise automatiquement :
- `requirements-windows.txt` - Version compatible Windows
- Module de reconnaissance faciale alternatif (OpenCV + Haar Cascades)
- Pas de dépendance MediaPipe

### Problème MediaPipe (Linux/Mac uniquement)
Si vous rencontrez des erreurs avec MediaPipe sur Linux/Mac :
```bash
# Désinstaller la version problématique
pip uninstall mediapipe

# Installer la dernière version stable
pip install mediapipe>=0.10.8
```

### Problème OpenCV
```bash
# Sur Windows, utiliser la version headless
pip uninstall opencv-python
pip install opencv-python-headless
```

### Problème de Permissions
```bash
# Sur Linux/Mac, vérifier les permissions
chmod +x install.py start.py
```

## 📊 Monitoring

- **Logs** dans `./logs/app.log`
- **Métriques** disponibles sur `/metrics`
- **Documentation API** sur `/docs`
- **Health check** sur `/health`

## 🔄 Mise à Jour

```bash
# Mettre à jour les dépendances
pip install -r requirements.txt --upgrade

# Mettre à jour la base de données
alembic upgrade head
```

## 📞 Support

Pour toute question ou problème :
- Consultez la documentation API sur `/docs`
- Vérifiez les logs dans `./logs/`
- Ouvrez une issue sur GitHub
