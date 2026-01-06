"""
Routeur principal de l'API ProctoFlex AI
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, surveillance, exams, users

# Création du routeur principal
api_router = APIRouter()

# Inclusion des sous-routeurs
api_router.include_router(auth.router, prefix="/auth", tags=["authentification"])
api_router.include_router(surveillance.router, prefix="/surveillance", tags=["surveillance"])
api_router.include_router(exams.router, prefix="/exams", tags=["examens"])
api_router.include_router(users.router, prefix="/users", tags=["utilisateurs"])

# TODO: Ajouter les routeurs suivants quand les fichiers seront créés:
# - sessions.router (prefix="/sessions", tags=["sessions"])
