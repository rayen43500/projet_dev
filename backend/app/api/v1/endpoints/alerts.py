"""
Endpoints génériques d'alertes pour ProctoFlex AI.
Utilisés notamment par le client desktop (verrouillage applicatif avancé)
pour remonter des violations (applications interdites, etc.).
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db, SecurityAlert, ExamSession, Exam, User
from app.core.security import get_current_user
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
    session_id: Optional[int] = None
    exam_id: Optional[int] = None
    student_id: Optional[int] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_desktop_alert(
    payload: DesktopAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reçoit une alerte depuis le client desktop et la persiste sous forme de SecurityAlert,
    puis la diffuse via WebSocket aux dashboards admin.
    """
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

    if session_obj is None:
        # On enregistre quand même l'alerte sans session associée, mais elle ne sera pas liée à un examen précis
        alert = SecurityAlert(
            session_id=None,
            alert_type=payload.type,
            severity=payload.severity,
            description=payload.description,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        # Pas de WebSocket ciblé par session, mais on peut le pousser globalement
        await send_alert_to_connections(alert, db)
        return {"id": alert.id, "session_bound": False}

    # Créer une SecurityAlert liée à la session d'examen
    alert = SecurityAlert(
        session_id=session_obj.id,
        alert_type=payload.type,
        severity=payload.severity,
        description=payload.description,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    await send_alert_to_connections(alert, db)

    return {
        "id": alert.id,
        "session_bound": True,
        "session_id": session_obj.id,
    }
