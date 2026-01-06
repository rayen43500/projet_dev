"""
Endpoints de surveillance ProctoFlex AI
Reconnaissance faciale et gestion des sessions
"""

import base64
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import logging

from app.core.database import get_db, User, ExamSession, SecurityAlert, Exam
from app.core.security import get_current_user
from app.ai.face_recognition import FaceRecognitionEngine
from app.api.v1.websocket import send_alert_to_connections
from app.models.surveillance import (
    FaceVerificationRequest,
    FaceVerificationResponse,
    SessionStartRequest,
    SessionStatusResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialisation du moteur de reconnaissance faciale
face_engine = FaceRecognitionEngine()

async def create_and_send_alert(
    db: Session,
    session_id: int,
    alert_type: str,
    severity: str,
    description: str
):
    """
    Crée une alerte et l'envoie via WebSocket
    """
    alert = SecurityAlert(
        session_id=session_id,
        alert_type=alert_type,
        severity=severity,
        description=description
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    # Envoyer via WebSocket
    await send_alert_to_connections(alert, db)
    
    return alert

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques pour le dashboard
    """
    from datetime import datetime, timedelta, timezone
    
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)
    
    # Si l'utilisateur est un étudiant, retourner des stats limitées
    if current_user.role == "student":
        # Examens planifiés pour cet étudiant
        planned_exams = db.query(Exam).filter(
            Exam.student_id == current_user.id,
            Exam.start_time >= now,
            Exam.is_active == True
        ).count()
        
        # Sessions actives de l'étudiant
        active_sessions = db.query(ExamSession).filter(
            ExamSession.student_id == current_user.id,
            ExamSession.status == "active"
        ).count()
        
        # Alertes critiques de l'étudiant
        student_sessions = db.query(ExamSession).filter(
            ExamSession.student_id == current_user.id
        ).all()
        session_ids = [s.id for s in student_sessions]
        critical_alerts = 0
        if session_ids:
            critical_alerts = db.query(SecurityAlert).filter(
                SecurityAlert.session_id.in_(session_ids),
                SecurityAlert.severity.in_(["high", "critical"]),
                SecurityAlert.is_resolved == False
            ).count()
        
        return {
            "planned_exams": planned_exams,
            "active_sessions": active_sessions,
            "critical_alerts": critical_alerts,
            "monitored_students": 0  # Pas applicable pour un étudiant
        }
    
    # Pour les enseignants/admin
    # Examens planifiés cette semaine
    planned_exams = db.query(Exam).filter(
        Exam.instructor_id == current_user.id,
        Exam.start_time >= week_start,
        Exam.start_time <= week_start + timedelta(days=7),
        Exam.is_active == True
    ).count()
    
    # Sessions actives
    active_sessions = db.query(ExamSession).filter(
        ExamSession.status == "active"
    ).count()
    
    # Alertes critiques non résolues
    critical_alerts = db.query(SecurityAlert).filter(
        SecurityAlert.severity.in_(["high", "critical"]),
        SecurityAlert.is_resolved == False
    ).count()
    
    # Étudiants surveillés sur les 30 derniers jours
    monitored_students = db.query(ExamSession).filter(
        ExamSession.start_time >= month_start
    ).distinct(ExamSession.student_id).count()
    
    return {
        "planned_exams": planned_exams,
        "active_sessions": active_sessions,
        "critical_alerts": critical_alerts,
        "monitored_students": monitored_students
    }

@router.post("/verify-identity", response_model=FaceVerificationResponse)
async def verify_identity(
    request: FaceVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Vérifie l'identité d'un étudiant par reconnaissance faciale
    """
    try:
        # Décodage des images base64
        reference_image_data = base64.b64decode(request.reference_image.split(',')[1])
        current_image_data = base64.b64decode(request.current_image.split(',')[1])
        
        # Conversion en numpy arrays
        reference_np = np.frombuffer(reference_image_data, np.uint8)
        current_np = np.frombuffer(current_image_data, np.uint8)
        
        reference_image = cv2.imdecode(reference_np, cv2.IMREAD_COLOR)
        current_image = cv2.imdecode(current_np, cv2.IMREAD_COLOR)
        
        # Vérification de l'identité
        verification_result = face_engine.verify_identity(reference_image, current_image)
        
        # Enregistrement de l'alerte si échec
        if not verification_result['verified']:
            alert = SecurityAlert(
                session_id=request.session_id,
                alert_type="face_verification_failed",
                severity="high",
                description=f"Échec de vérification d'identité: {verification_result.get('error', 'Confiance insuffisante')}"
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            
            # Envoyer l'alerte via WebSocket
            from app.api.v1.websocket import send_alert_to_connections
            await send_alert_to_connections(alert, db)
        
        return FaceVerificationResponse(
            verified=verification_result['verified'],
            confidence=verification_result['confidence'],
            message="Vérification d'identité réussie" if verification_result['verified'] else "Vérification d'identité échouée"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la vérification: {str(e)}")

@router.post("/start-session", response_model=SessionStatusResponse)
async def start_exam_session(
    request: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Démarre une session d'examen avec vérification d'identité
    """
    try:
        # Vérification que l'utilisateur est un étudiant
        if current_user.role != "student":
            raise HTTPException(status_code=403, detail="Seuls les étudiants peuvent démarrer des sessions d'examen")
        
        # Vérification de l'identité
        if not request.identity_verified:
            raise HTTPException(status_code=400, detail="L'identité doit être vérifiée avant de démarrer la session")
        
        # Création de la session
        session = ExamSession(
            exam_id=request.exam_id,
            student_id=current_user.id,
            status="active"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return SessionStatusResponse(
            session_id=session.id,
            status="active",
            message="Session d'examen démarrée avec succès"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du démarrage de la session: {str(e)}")

@router.get("/session/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère le statut d'une session d'examen
    """
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    # Vérification des permissions
    if current_user.role == "student" and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette session")
    
    return SessionStatusResponse(
        session_id=session.id,
        status=session.status,
        message=f"Session {session.status}"
    )

@router.post("/session/{session_id}/end")
async def end_exam_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Termine une session d'examen
    """
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    # Vérification des permissions
    if current_user.role == "student" and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette session")
    
    # Mise à jour du statut
    session.status = "completed"
    db.commit()
    
    return {"message": "Session terminée avec succès"}

@router.get("/sessions/active")
async def get_active_sessions(
    include_completed: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les sessions actives (et optionnellement terminées) pour le dashboard
    """
    # Si l'utilisateur est un étudiant, ne retourner que ses sessions
    if current_user.role == "student":
        query = db.query(ExamSession).filter(ExamSession.student_id == current_user.id)
        if not include_completed:
            query = query.filter(ExamSession.status == "active")
        sessions = query.all()
    else:
        # Pour les enseignants/admin, retourner toutes les sessions
        query = db.query(ExamSession)
        if not include_completed:
            query = query.filter(ExamSession.status == "active")
        sessions = query.order_by(ExamSession.start_time.desc()).limit(100).all()
    
    from datetime import datetime, timezone
    result = []
    for session in sessions:
        # Calculer la durée
        duration = datetime.now(timezone.utc) - session.start_time
        hours = duration.seconds // 3600
        minutes = (duration.seconds % 3600) // 60
        
        # Compter les alertes
        alerts_count = db.query(SecurityAlert).filter(
            SecurityAlert.session_id == session.id,
            SecurityAlert.is_resolved == False
        ).count()
        
        # Récupérer l'étudiant et l'examen
        student = db.query(User).filter(User.id == session.student_id).first()
        exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
        
        result.append({
            "id": session.id,
            "student": student.full_name if student else "Inconnu",
            "student_id": session.student_id,
            "exam": exam.title if exam else "Examen inconnu",
            "exam_id": session.exam_id,
            "status": session.status,
            "duration": f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m",
            "alerts": alerts_count,
            "risk": "Moyen" if alerts_count > 0 else "Faible",
            "start_time": session.start_time.isoformat() if session.start_time else None
        })
    
    return result

@router.get("/alerts/recent")
async def get_recent_alerts(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les alertes récentes pour le dashboard
    """
    from datetime import datetime, timedelta, timezone
    
    # Si l'utilisateur est un étudiant, ne retourner que ses alertes
    if current_user.role == "student":
        # Récupérer les sessions de l'étudiant
        student_sessions = db.query(ExamSession).filter(
            ExamSession.student_id == current_user.id
        ).all()
        session_ids = [s.id for s in student_sessions]
        
        if not session_ids:
            return []
        
        alerts = db.query(SecurityAlert).filter(
            SecurityAlert.session_id.in_(session_ids)
        ).order_by(SecurityAlert.timestamp.desc()).limit(limit).all()
    else:
        # Pour les enseignants/admin, retourner toutes les alertes récentes
        alerts = db.query(SecurityAlert).order_by(
            SecurityAlert.timestamp.desc()
        ).limit(limit).all()
    
    result = []
    for alert in alerts:
        # Récupérer la session, l'étudiant et l'examen
        session = db.query(ExamSession).filter(ExamSession.id == alert.session_id).first()
        if not session:
            continue
            
        student = db.query(User).filter(User.id == session.student_id).first()
        exam = db.query(Exam).filter(Exam.id == session.exam_id).first()
        
        # Calculer le temps écoulé
        time_diff = datetime.now(timezone.utc) - alert.timestamp
        if time_diff < timedelta(minutes=1):
            time_str = "À l'instant"
        elif time_diff < timedelta(hours=1):
            minutes = int(time_diff.total_seconds() / 60)
            time_str = f"Il y a {minutes} min"
        elif time_diff < timedelta(days=1):
            hours = int(time_diff.total_seconds() / 3600)
            time_str = f"Il y a {hours}h"
        else:
            days = int(time_diff.total_seconds() / 86400)
            time_str = f"Il y a {days} jour(s)"
        
        result.append({
            "id": alert.id,
            "type": alert.alert_type,
            "student": student.full_name if student else "Inconnu",
            "exam": exam.title if exam else "Examen inconnu",
            "time": time_str,
            "severity": alert.severity.lower() if alert.severity else "low",
            "description": alert.description,
            "timestamp": alert.timestamp.isoformat() if alert.timestamp else None
        })
    
    return result

@router.get("/session/{session_id}/alerts")
async def get_session_alerts(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les alertes de sécurité d'une session
    """
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    # Vérification des permissions
    if current_user.role == "student" and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette session")
    
    alerts = db.query(SecurityAlert).filter(SecurityAlert.session_id == session_id).all()
    
    return [
        {
            "id": alert.id,
            "type": alert.alert_type,
            "severity": alert.severity,
            "description": alert.description,
            "timestamp": alert.timestamp,
            "resolved": alert.is_resolved
        }
        for alert in alerts
    ]

@router.post("/analyze")
async def analyze_surveillance_data_with_alerts(
    session_id: int,
    video_frame: Optional[str] = None,
    audio_chunk: Optional[str] = None,
    timestamp: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyse les données de surveillance et crée des alertes automatiquement
    """
    try:
        # Vérifier que la session existe
        session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        
        alerts_created = []
        
        # Analyser la vidéo si disponible
        if video_frame:
            try:
                # Décodage de l'image
                image_data_clean = video_frame.split(',')[1] if ',' in video_frame else video_frame
                image_bytes = base64.b64decode(image_data_clean)
                image_np = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
                
                # Analyse du visage
                face_result = face_engine.analyze_face_behavior(image)
                
                # Créer des alertes si nécessaire
                if face_result.get('face_not_detected'):
                    alert = await create_and_send_alert(
                        db, session_id, 'face_not_detected', 'medium',
                        'Visage non détecté - l\'étudiant pourrait ne pas être présent'
                    )
                    alerts_created.append(alert.id)
                
                if face_result.get('multiple_faces'):
                    alert = await create_and_send_alert(
                        db, session_id, 'multiple_faces', 'high',
                        'Plusieurs visages détectés - personne non autorisée possible'
                    )
                    alerts_created.append(alert.id)
                
                if face_result.get('gaze_not_on_screen'):
                    alert = await create_and_send_alert(
                        db, session_id, 'gaze_detection', 'medium',
                        'Le regard n\'est pas dirigé vers l\'écran'
                    )
                    alerts_created.append(alert.id)
                
            except Exception as e:
                logger.error(f"Erreur lors de l'analyse vidéo: {e}")
        
        # Analyser l'audio si disponible
        if audio_chunk:
            try:
                # Ici, on pourrait analyser l'audio et créer des alertes
                # Pour l'instant, c'est une simulation
                import random
                if random.random() < 0.1:  # 10% de chance de sons suspects
                    alert = await create_and_send_alert(
                        db, session_id, 'suspicious_audio', 'medium',
                        'Sons suspects détectés dans l\'environnement'
                    )
                    alerts_created.append(alert.id)
            except Exception as e:
                logger.error(f"Erreur lors de l'analyse audio: {e}")
        
        return {
            "session_id": session_id,
            "alerts_created": len(alerts_created),
            "alert_ids": alerts_created,
            "timestamp": timestamp or datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de surveillance: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")

@router.post("/analyze-face")
async def analyze_face_behavior(
    image_data: str,
    current_user: User = Depends(get_current_user)
):
    """
    Analyse le comportement du visage en temps réel
    """
    try:
        # Décodage de l'image
        image_data_clean = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data_clean)
        image_np = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
        
        # Analyse du comportement
        analysis = face_engine.analyze_face_behavior(image)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")
