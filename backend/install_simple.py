#!/usr/bin/env python3
"""
Script d'installation simplifié pour ProctoFlex AI Backend
Utilise les dépendances optimisées pour Windows
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Exécute une commande avec gestion d'erreur"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} réussi")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} échoué")
        print(f"Erreur: {e.stderr}")
        return False

def create_directories():
    """Crée les répertoires nécessaires"""
    directories = ["logs", "uploads", "uploads/images", "uploads/videos", "uploads/audio", "temp"]
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Répertoire {directory} créé")

def create_env_file():
    """Crée le fichier .env s'il n'existe pas"""
    env_content = """# Configuration du serveur
HOST=localhost
PORT=8000
DEBUG=true

# Base de données SQLite
DATABASE_URL=sqlite:///./proctoflex.db

# Sécurité
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]

# Logs
LOG_LEVEL=info
"""
    
    if not Path(".env").exists():
        with open(".env", "w") as f:
            f.write(env_content)
        print("✅ Fichier .env créé")
    else:
        print("✅ Fichier .env existe déjà")

def main():
    """Fonction principale"""
    print("🚀 Installation simplifiée de ProctoFlex AI Backend")
    print("=" * 50)
    
    # Vérifier Python
    python_version = sys.version_info
    print(f"🐍 Python {python_version.major}.{python_version.minor}.{python_version.micro} détecté")
    
    if python_version < (3, 8):
        print("❌ Python 3.8+ requis")
        sys.exit(1)
    
    # Mettre à jour pip
    if not run_command("python -m pip install --upgrade pip", "Mise à jour de pip"):
        print("⚠️  Échec de la mise à jour de pip, continuation...")
    
    # Installer les dépendances optimisées
    if not run_command("pip install -r requirements.txt", "Installation des dépendances"):
        print("❌ Installation des dépendances échouée")
        sys.exit(1)
    
    # Créer les répertoires
    print("\n📁 Création des répertoires...")
    create_directories()
    
    # Créer le fichier .env
    print("\n⚙️  Configuration...")
    create_env_file()
    
    print("\n🎉 Installation terminée avec succès!")
    print("\n📋 Prochaines étapes:")
    print("1. Démarrer le serveur: python start.py")
    print("2. Accéder à l'application: http://localhost:8000")
    print("3. Documentation API: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
