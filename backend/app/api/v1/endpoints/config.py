"""
Endpoints de configuration pour ProctoFlex AI
Utilisés notamment par le client desktop pour récupérer la configuration du verrouillage applicatif
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from pydantic import BaseModel

from app.core.security import get_current_user
from app.core.database import User

router = APIRouter()


class LockConfig(BaseModel):
    """
    Configuration retournée au client desktop pour le verrouillage avancé
    (applications surveillées, fréquence, etc.).

    Pour l'instant, les valeurs sont statiques mais pourront être rendues dynamiques plus tard.
    """

    advanced_lock_enabled: bool = True
    polling_interval_ms: int = 1000
    send_violations_to_server: bool = True
    version: str = "1.0.0"


@router.get("/lock", response_model=LockConfig)
async def get_lock_config(current_user: User = Depends(get_current_user)) -> LockConfig:
    """
    Retourne la configuration de verrouillage pour l'application desktop.

    Accessible aux étudiants et aux enseignants/admins.
    """
    # On pourrait adapter la configuration en fonction du rôle ou de l'examen ici.
    return LockConfig()
