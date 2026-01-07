"""
Routeur principal de l'API ProctoFlex AI
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, surveillance, exams, users, config, alerts

# Création du routeur principal
api_router = APIRouter()

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {
        "status": "healthy",
        "service": "ProctoFlex AI API",
        "version": "1.0.0"
    }

# Inclusion des sous-routeurs
api_router.include_router(auth.router, prefix="/auth", tags=["authentification"])
api_router.include_router(surveillance.router, prefix="/surveillance", tags=["surveillance"])
api_router.include_router(exams.router, prefix="/exams", tags=["examens"])
api_router.include_router(users.router, prefix="/users", tags=["utilisateurs"])
api_router.include_router(config.router, prefix="/config", tags=["configuration"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alertes"])
