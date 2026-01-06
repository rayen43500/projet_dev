#!/usr/bin/env python3
"""
Script de test pour vérifier l'installation de ProctoFlex AI Backend
"""

import sys
import importlib
from pathlib import Path

def test_import(module_name: str, description: str) -> bool:
    """Teste l'import d'un module"""
    try:
        importlib.import_module(module_name)
        print(f"✅ {description}: {module_name}")
        return True
    except ImportError as e:
        print(f"❌ {description}: {module_name} - {e}")
        return False
    except Exception as e:
        print(f"⚠️  {description}: {module_name} - Erreur: {e}")
        return False

def test_opencv():
    """Teste OpenCV et ses fonctionnalités"""
    try:
        import cv2
        print(f"✅ OpenCV version: {cv2.__version__}")
        
        # Tester la détection de visages
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        if face_cascade.empty():
            print("❌ Classificateur Haar non chargé")
            return False
        else:
            print("✅ Classificateur Haar chargé")
            return True
            
    except Exception as e:
        print(f"❌ Erreur OpenCV: {e}")
        return False

def test_face_recognition_alt():
    """Teste le module de reconnaissance faciale alternatif"""
    try:
        from app.ai.face_recognition_alt import FaceRecognitionEngineAlt
        engine = FaceRecognitionEngineAlt()
        print("✅ Moteur de reconnaissance faciale alternatif initialisé")
        return True
    except Exception as e:
        print(f"❌ Erreur reconnaissance faciale: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🧪 Test d'installation ProctoFlex AI Backend")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 0
    
    # Test des modules de base
    print("\n📦 Test des modules de base:")
    base_modules = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("sqlalchemy", "SQLAlchemy"),
        ("pydantic", "Pydantic"),
        ("python-jose", "Python-Jose"),
        ("passlib", "Passlib"),
    ]
    
    for module, description in base_modules:
        total_tests += 1
        if test_import(module, description):
            tests_passed += 1
    
    # Test des modules IA
    print("\n🤖 Test des modules IA:")
    ai_modules = [
        ("cv2", "OpenCV"),
        ("numpy", "NumPy"),
        ("PIL", "Pillow"),
    ]
    
    for module, description in ai_modules:
        total_tests += 1
        if test_import(module, description):
            tests_passed += 1
    
    # Test OpenCV spécifique
    print("\n📷 Test OpenCV:")
    total_tests += 1
    if test_opencv():
        tests_passed += 1
    
    # Test du module alternatif
    print("\n👤 Test reconnaissance faciale:")
    total_tests += 1
    if test_face_recognition_alt():
        tests_passed += 1
    
    # Résultats
    print("\n" + "=" * 50)
    print(f"📊 Résultats: {tests_passed}/{total_tests} tests réussis")
    
    if tests_passed == total_tests:
        print("🎉 Tous les tests sont passés ! L'installation est réussie.")
        return True
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez l'installation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
