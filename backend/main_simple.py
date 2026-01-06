#!/usr/bin/env python3
"""
ProctoFlex AI - Backend API
Version simplifiée pour le développement
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configuration de base
app = FastAPI(
    title="ProctoFlex AI API",
    description="API de surveillance pour examens en ligne",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Point d'entrée principal"""
    return {
        "message": "ProctoFlex AI API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {
        "status": "healthy",
        "service": "proctoflex-backend",
        "version": "1.0.0"
    }

@app.get("/api/v1/users")
async def get_users():
    """Liste des utilisateurs (simulée)"""
    return [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@proctoflex.ai",
            "role": "admin"
        },
        {
            "id": 2,
            "username": "student1",
            "email": "student1@example.com",
            "role": "student"
        }
    ]

@app.get("/api/v1/exams")
async def get_exams():
    """Liste des examens (simulée)"""
    return [
        {
            "id": 1,
            "title": "Examen de Programmation",
            "duration": 120,
            "status": "active"
        },
        {
            "id": 2,
            "title": "Examen de Mathématiques",
            "duration": 90,
            "status": "scheduled"
        }
    ]

@app.post("/api/v1/auth/login")
async def login():
    """Authentification (simulée)"""
    return {
        "access_token": "fake_token_123",
        "token_type": "bearer",
        "user": {
            "id": 1,
            "username": "admin",
            "role": "admin"
        }
    }

if __name__ == "__main__":
    print("🚀 Démarrage de ProctoFlex AI Backend...")
    print("📍 API disponible sur: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/health")
    print()
    
    uvicorn.run(
        "main_simple:app",
        host="localhost",
        port=8000,
        reload=True,
        log_level="info"
    )
