#!/usr/bin/env python3
"""
Script de démarrage rapide pour ProctoFlex AI Backend
"""

import os
import sys
import uvicorn
from pathlib import Path

def check_environment():
    """Vérifie la configuration de l'environnement"""
    print("🔍 Vérification de l'environnement...")
    
    # Vérifier le fichier .env
    if not Path(".env").exists():
        print("⚠️  Fichier .env non trouvé")
        print("💡 Exécutez 'python install.py' pour créer la configuration")
        return False
    
    # Vérifier les répertoires
    required_dirs = ["logs", "uploads"]
    for directory in required_dirs:
        if not Path(directory).exists():
            print(f"⚠️  Répertoire {directory} manquant")
            print("💡 Exécutez 'python install.py' pour créer les répertoires")
            return False
    
    print("✅ Environnement configuré")
    return True

def start_server():
    """Démarre le serveur FastAPI"""
    print("\n🚀 Démarrage du serveur ProctoFlex AI...")
    
    # Configuration par défaut
    host = os.getenv("HOST", "localhost")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    print(f"📍 Serveur: http://{host}:{port}")
    print(f"🔧 Mode debug: {debug}")
    print(f"📁 Répertoire de travail: {os.getcwd()}")
    
    try:
        uvicorn.run(
            "main_simple:app",
            host=host,
            port=port,
            reload=debug,
            log_level="info" if debug else "warning"
        )
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté par l'utilisateur")
    except Exception as e:
        print(f"\n❌ Erreur lors du démarrage: {e}")
        return False
    
    return True

def main():
    """Fonction principale"""
    print("🎯 ProctoFlex AI - Script de Démarrage")
    print("=" * 40)
    
    # Vérifier l'environnement
    if not check_environment():
        print("\n❌ Configuration manquante")
        print("💡 Exécutez d'abord: python install.py")
        sys.exit(1)
    
    # Démarrer le serveur
    if not start_server():
        sys.exit(1)

if __name__ == "__main__":
    main()
