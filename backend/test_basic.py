#!/usr/bin/env python3
"""
Script de test basique pour vérifier l'installation minimale
"""

import sys
import importlib
from pathlib import Path

def test_import(module_name: str, description: str, required: bool = True) -> bool:
    """Teste l'import d'un module"""
    try:
        importlib.import_module(module_name)
        print(f"✅ {description}: {module_name}")
        return True
    except ImportError as e:
        if required:
            print(f"❌ {description}: {module_name} - {e}")
        else:
            print(f"⚠️  {description}: {module_name} - Non installé (optionnel)")
        return False
    except Exception as e:
        print(f"⚠️  {description}: {module_name} - Erreur: {e}")
        return False

def test_fastapi_basic():
    """Teste FastAPI de base"""
    try:
        import fastapi
        print(f"✅ FastAPI version: {fastapi.__version__}")
        
        # Test de création d'app
        app = fastapi.FastAPI()
        print("✅ Application FastAPI créée avec succès")
        return True
        
    except Exception as e:
        print(f"❌ Erreur FastAPI: {e}")
        return False

def test_uvicorn_basic():
    """Teste Uvicorn de base"""
    try:
        import uvicorn
        print(f"✅ Uvicorn version: {uvicorn.__version__}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur Uvicorn: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🧪 Test d'installation basique ProctoFlex AI Backend")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 0
    
    # Test des modules essentiels (obligatoires)
    print("\n📦 Test des modules essentiels:")
    essential_modules = [
        ("fastapi", "FastAPI", True),
        ("uvicorn", "Uvicorn", True),
        ("pydantic", "Pydantic", True),
        ("python-dotenv", "Python-Dotenv", True),
    ]
    
    for module, description, required in essential_modules:
        total_tests += 1
        if test_import(module, description, required):
            tests_passed += 1
    
    # Test des modules optionnels
    print("\n🔧 Test des modules optionnels:")
    optional_modules = [
        ("sqlalchemy", "SQLAlchemy", False),
        ("psycopg2", "PostgreSQL", False),
        ("cv2", "OpenCV", False),
        ("numpy", "NumPy", False),
        ("PIL", "Pillow", False),
    ]
    
    for module, description, required in optional_modules:
        total_tests += 1
        if test_import(module, description, required):
            tests_passed += 1
    
    # Tests spécifiques
    print("\n🚀 Tests spécifiques:")
    
    # Test FastAPI
    total_tests += 1
    if test_fastapi_basic():
        tests_passed += 1
    
    # Test Uvicorn
    total_tests += 1
    if test_uvicorn_basic():
        tests_passed += 1
    
    # Résultats
    print("\n" + "=" * 60)
    print(f"📊 Résultats: {tests_passed}/{total_tests} tests réussis")
    
    # Déterminer le statut
    essential_passed = sum(1 for module, _, required in essential_modules 
                          if test_import(module, "", required))
    
    if essential_passed == len([m for m in essential_modules if m[2]]):
        print("🎉 Installation de base réussie ! L'application peut démarrer.")
        print("💡 Certaines fonctionnalités avancées peuvent être limitées.")
        return True
    else:
        print("❌ Installation de base échouée. Vérifiez l'installation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
