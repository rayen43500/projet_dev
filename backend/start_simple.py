#!/usr/bin/env python3
"""
Script de démarrage simplifié pour ProctoFlex AI Backend
Ne dépend pas du fichier .env pour éviter les problèmes d'encodage
"""

import os
import sys
import uvicorn
from pathlib import Path

def check_environment():
    """Vérifie la configuration de l'environnement"""
    print("🔍 Vérification de l'environnement...")
    
    # Vérifier les répertoires
    required_dirs = ["logs", "uploads"]
    for directory in required_dirs:
        if not Path(directory).exists():
            print(f"⚠️  Répertoire {directory} manquant")
            Path(directory).mkdir(exist_ok=True)
            print(f"✅ Répertoire {directory} créé")
    
    print("✅ Environnement configuré")
    return True

def start_server():
    """Démarre le serveur FastAPI"""
    print("\n🚀 Démarrage du serveur ProctoFlex AI...")
    
    # Configuration directe (pas de fichier .env)
    host = "localhost"
    port = 8000
    debug = True
    
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
    print("🎯 ProctoFlex AI - Script de Démarrage Simplifié")
    print("=" * 50)
    
    # Vérifier l'environnement
    if not check_environment():
        print("\n❌ Configuration manquante")
        sys.exit(1)
    
    # Démarrer le serveur
    if not start_server():
        sys.exit(1)

if __name__ == "__main__":
    main()
