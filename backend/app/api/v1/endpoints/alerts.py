"""
Endpoints génériques d'alertes pour ProctoFlex AI.
Utilisés notamment par le client desktop (verrouillage applicatif avancé)
pour remonter des violations (applications interdites, etc.).
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional as Opt

from app.core.database import get_db, SecurityAlert, ExamSession, Exam, User
from app.core.security import verify_token
from app.api.v1.websocket import send_alert_to_connections

router = APIRouter()


class DesktopAlertCreate(BaseModel):
    """
    Modèle d'alerte envoyé par l'application desktop.
    Tous les champs sont optionnels pour être tolérant aux différentes versions du client.
    """
    type: str = "desktop_violation"
    severity: str = "medium"
    description: str
    session_id: Opt[int] = None
    exam_id: Opt[int] = None
    student_id: Opt[int] = None
    process: Opt[str] = None  # Nom du processus détecté


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_desktop_alert(
    payload: DesktopAlertCreate,
    authorization: Opt[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    """
    Reçoit une alerte depuis le client desktop et la persiste sous forme de SecurityAlert,
    puis la diffuse via WebSocket aux dashboards admin.
    
    L'authentification est optionnelle pour permettre au desktop app d'envoyer des alertes.
    """
    # Essayer de récupérer l'utilisateur si un token est fourni (optionnel)
    # L'authentification est optionnelle pour permettre au desktop app d'envoyer des alertes
    
    # Construire la description complète avec le nom du processus si fourni
    description = payload.description
    if payload.process:
        description = f"{description} - Processus: {payload.process}"
    
    # Déduire session_id / exam_id si possible à partir du contexte
    session_obj = None

    if payload.session_id is not None:
        session_obj = (
            db.query(ExamSession)
            .filter(ExamSession.id == payload.session_id)
            .first()
        )
    elif payload.exam_id is not None and payload.student_id is not None:
        session_obj = (
            db.query(ExamSession)
            .filter(
                ExamSession.exam_id == payload.exam_id,
                ExamSession.student_id == payload.student_id,
                ExamSession.status == "active",
            )
            .first()
        )
    elif payload.exam_id is not None:
        # Essayer de trouver une session active pour cet examen
        session_obj = (
            db.query(ExamSession)
            .filter(
                ExamSession.exam_id == payload.exam_id,
                ExamSession.status == "active",
            )
            .first()
        )

    if session_obj is None:
        # On enregistre quand même l'alerte sans session associée, mais elle ne sera pas liée à un examen précis
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Création d'alerte sans session: type={payload.type}, severity={payload.severity}, process={payload.process}, description={description[:100]}")
        
        alert = SecurityAlert(
            session_id=None,
            alert_type=payload.type,
            severity=payload.severity,
            description=description,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        logger.info(f"✅ Alerte créée avec succès: id={alert.id}, type={alert.alert_type}, severity={alert.severity}, session_id=None")
        logger.info(f"   Description: {alert.description}")
        # Envoyer via WebSocket même sans session
        await send_alert_to_connections(alert, db)
        return {"id": alert.id, "session_bound": False}

    # Créer une SecurityAlert liée à la session d'examen
    import logging
    logger = logging.getLogger(__name__)
    
    alert = SecurityAlert(
        session_id=session_obj.id,
        alert_type=payload.type,
        severity=payload.severity,
        description=description,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    logger.info(f"✅ Alerte créée avec succès: id={alert.id}, type={alert.alert_type}, severity={alert.severity}, session_id={session_obj.id}")
    logger.info(f"   Description: {alert.description}")

    await send_alert_to_connections(alert, db)

    return {
        "id": alert.id,
        "session_bound": True,
        "session_id": session_obj.id,
    }
