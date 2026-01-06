"""
ProctoFlex AI - Backend API
Serveur FastAPI pour la surveillance d'examens en ligne
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn
from typing import List

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router
from app.core.security import get_current_user

# Création des tables au démarrage
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Créer les tables au démarrage
    Base.metadata.create_all(bind=engine)
    yield

# Configuration de l'application FastAPI
app = FastAPI(
    title="ProctoFlex AI API",
    description="API de surveillance intelligente pour examens en ligne",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes API
app.include_router(api_router, prefix="/api/v1")

# Route de santé
@app.get("/health")
async def health_check():
    """Vérification de l'état du serveur"""
    return {
        "status": "healthy",
        "service": "ProctoFlex AI Backend",
        "version": "1.0.0"
    }

# Route racine
@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "message": "Bienvenue sur ProctoFlex AI API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
