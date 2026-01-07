"""
Endpoints de configuration pour ProctoFlex AI
Utilisés notamment par le client desktop pour récupérer la configuration du verrouillage applicatif
"""

from fastapi import APIRouter, Depends, Header
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.core.database import User

router = APIRouter()


class LockConfig(BaseModel):
    """
    Configuration retournée au client desktop pour le verrouillage avancé
    (applications surveillées, fréquence, etc.).

    Pour l'instant, les valeurs sont statiques mais pourront être rendues dynamiques plus tard.
    """
    allowed_apps: list = []
    forbidden_apps: list = ["discord.exe", "whatsapp.exe", "teams.exe", "chrome.exe", "cursor.exe", "msedge.exe", "firefox.exe", "opera.exe"]
    policy: dict = {"auto_kill": False, "repeat_threshold": 2}
    advanced_lock_enabled: bool = True
    polling_interval_ms: int = 4000
    send_violations_to_server: bool = True
    version: str = "1.0.0"


@router.get("/lock", response_model=LockConfig)
async def get_lock_config() -> LockConfig:
    """
    Retourne la configuration de verrouillage pour l'application desktop.
    
    Accessible sans authentification pour permettre au desktop app de fonctionner.
    """
    # Configuration par défaut avec liste d'applications interdites
    return LockConfig()
