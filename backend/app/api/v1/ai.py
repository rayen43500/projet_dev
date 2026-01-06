"""
Endpoints API pour les services IA de ProctoFlex AI
Reconnaissance faciale, détection d'objets, analyse audio
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer
from typing import Dict, List, Optional
import logging
from pydantic import BaseModel
import base64

from app.ai.face_detection import face_detection_service
from app.ai.object_detection import object_detection_service
from app.core.security import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["Intelligence Artificielle"])
security = HTTPBearer()

# Modèles Pydantic pour les requêtes
class IdentityVerificationRequest(BaseModel):
    current_image: str  # base64
    reference_image: str  # base64

class FaceAnalysisRequest(BaseModel):
    image: str  # base64

class ObjectDetectionRequest(BaseModel):
    image: str  # base64

class AudioAnalysisRequest(BaseModel):
    audio_data: str  # base64
    duration: float  # durée en secondes

class SurveillanceAnalysisRequest(BaseModel):
    session_id: str
    video_frame: Optional[str] = None  # base64
    audio_chunk: Optional[str] = None  # base64
    screen_capture: Optional[str] = None  # base64
    timestamp: str

# Réponses
class IdentityVerificationResponse(BaseModel):
    verified: bool
    confidence: float
    distance: float
    threshold: float
    reason: str

class FaceAnalysisResponse(BaseModel):
    faces_detected: int
    face_quality: Dict
    multiple_faces: Dict
    gaze_analysis: Optional[Dict] = None

class ObjectDetectionResponse(BaseModel):
    objects_detected: int
    alert_level: str
    detections: List[Dict]
    summary: Dict
    patterns: Optional[Dict] = None

class AudioAnalysisResponse(BaseModel):
    voice_detected: bool
    noise_level: float
    suspicious_sounds: bool
    analysis: Dict

class SurveillanceAnalysisResponse(BaseModel):
    session_id: str
    timestamp: str
    face_analysis: Optional[FaceAnalysisResponse] = None
    object_analysis: Optional[ObjectDetectionResponse] = None
    audio_analysis: Optional[AudioAnalysisResponse] = None
    overall_risk: str
    alerts: List[Dict]

@router.post("/verify-identity", response_model=IdentityVerificationResponse)
async def verify_identity(
    request: IdentityVerificationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Vérifie l'identité d'un utilisateur en comparant deux images
    
    Args:
        request: Images actuelles et de référence
        current_user: Utilisateur authentifié
        
    Returns:
        Résultat de la vérification d'identité
    """
    try:
        logger.info(f"Vérification d'identité pour l'utilisateur {current_user.id}")
        
        result = face_detection_service.verify_identity(
            request.current_image,
            request.reference_image
        )
        
        return IdentityVerificationResponse(**result)
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification d'identité: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification d'identité")

@router.post("/analyze-face", response_model=FaceAnalysisResponse)
async def analyze_face(
    request: FaceAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyse une image pour détecter et analyser les visages
    
    Args:
        request: Image à analyser
        current_user: Utilisateur authentifié
        
    Returns:
        Analyse des visages détectés
    """
    try:
        logger.info(f"Analyse faciale pour l'utilisateur {current_user.id}")
        
        # Décoder l'image
        import numpy as np
        from PIL import Image
        import io
        
        # Supprimer le préfixe data:image/...;base64, si présent
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Décoder l'image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convertir en RGB si nécessaire
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convertir en array numpy
        img_array = np.array(image)
        
        # Détecter les visages
        faces = face_detection_service.detect_faces(img_array)
        
        # Analyser la qualité
        quality = face_detection_service.analyze_face_quality(request.image)
        
        # Détecter les visages multiples
        multiple_faces = face_detection_service.detect_multiple_faces(request.image)
        
        # Analyser le regard si un visage est détecté
        gaze_analysis = None
        if faces:
            gaze_analysis = face_detection_service.track_gaze(request.image, faces[0]['bbox'])
        
        return FaceAnalysisResponse(
            faces_detected=len(faces),
            face_quality=quality,
            multiple_faces=multiple_faces,
            gaze_analysis=gaze_analysis
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse faciale: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'analyse faciale")

@router.post("/detect-objects", response_model=ObjectDetectionResponse)
async def detect_objects(
    request: ObjectDetectionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Détecte les objets suspects dans une image
    
    Args:
        request: Image à analyser
        current_user: Utilisateur authentifié
        
    Returns:
        Résultat de la détection d'objets
    """
    try:
        logger.info(f"Détection d'objets pour l'utilisateur {current_user.id}")
        
        result = object_detection_service.detect_suspicious_objects(request.image)
        
        # Analyser les patterns si des objets sont détectés
        patterns = None
        if result['detections']:
            patterns = object_detection_service.analyze_object_patterns(result['detections'])
        
        return ObjectDetectionResponse(
            objects_detected=result['objects_detected'],
            alert_level=result['alert_level'],
            detections=result['detections'],
            summary=result['summary'],
            patterns=patterns
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la détection d'objets: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la détection d'objets")

@router.post("/analyze-audio", response_model=AudioAnalysisResponse)
async def analyze_audio(
    request: AudioAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyse un segment audio pour détecter des sons suspects
    
    Args:
        request: Données audio à analyser
        current_user: Utilisateur authentifié
        
    Returns:
        Résultat de l'analyse audio
    """
    try:
        logger.info(f"Analyse audio pour l'utilisateur {current_user.id}")
        
        # Pour l'instant, retourner une analyse simulée
        # En production, implémenter l'analyse audio réelle
        
        # Simuler l'analyse audio
        import random
        
        # Décoder les données audio (simulation)
        audio_data = request.audio_data
        if ',' in audio_data:
            audio_data = audio_data.split(',')[1]
        
        # Analyser la longueur des données pour estimer le volume
        audio_bytes = base64.b64decode(audio_data)
        data_length = len(audio_bytes)
        
        # Simulation de l'analyse
        noise_level = min(1.0, data_length / 10000)  # Normalisé entre 0 et 1
        voice_detected = noise_level > 0.3
        suspicious_sounds = random.random() < 0.1  # 10% de chance de sons suspects
        
        analysis = {
            'duration': request.duration,
            'data_size': data_length,
            'frequency_analysis': {
                'low_freq': random.uniform(0.1, 0.5),
                'mid_freq': random.uniform(0.2, 0.6),
                'high_freq': random.uniform(0.1, 0.4)
            },
            'voice_characteristics': {
                'pitch': random.uniform(80, 200),
                'clarity': random.uniform(0.5, 1.0)
            } if voice_detected else None
        }
        
        return AudioAnalysisResponse(
            voice_detected=voice_detected,
            noise_level=noise_level,
            suspicious_sounds=suspicious_sounds,
            analysis=analysis
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse audio: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'analyse audio")

@router.post("/surveillance-analysis", response_model=SurveillanceAnalysisResponse)
async def analyze_surveillance_data(
    request: SurveillanceAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyse complète des données de surveillance (vidéo, audio, écran)
    
    Args:
        request: Données de surveillance à analyser
        current_user: Utilisateur authentifié
        
    Returns:
        Analyse complète avec évaluation des risques
    """
    try:
        logger.info(f"Analyse de surveillance pour la session {request.session_id}")
        
        alerts = []
        risk_factors = []
        
        # Analyser la vidéo si disponible
        face_analysis = None
        if request.video_frame:
            try:
                face_result = await analyze_face(FaceAnalysisRequest(image=request.video_frame), current_user)
                face_analysis = face_result
                
                # Vérifier les alertes faciales
                if face_result.faces_detected == 0:
                    alerts.append({
                        'type': 'face_not_detected',
                        'severity': 'medium',
                        'description': 'Aucun visage détecté'
                    })
                    risk_factors.append(0.3)
                
                if face_result.multiple_faces['multiple_faces']:
                    alerts.append({
                        'type': 'multiple_faces',
                        'severity': 'high',
                        'description': 'Plusieurs visages détectés'
                    })
                    risk_factors.append(0.8)
                
                if face_result.gaze_analysis and not face_result.gaze_analysis['looking_at_screen']:
                    alerts.append({
                        'type': 'gaze_away',
                        'severity': 'medium',
                        'description': 'Regard détourné de l\'écran'
                    })
                    risk_factors.append(0.4)
                    
            except Exception as e:
                logger.warning(f"Erreur lors de l'analyse faciale: {e}")
        
        # Analyser les objets si disponible
        object_analysis = None
        if request.video_frame:
            try:
                object_result = await detect_objects(ObjectDetectionRequest(image=request.video_frame), current_user)
                object_analysis = object_result
                
                # Vérifier les alertes d'objets
                if object_result.objects_detected > 0:
                    if object_result.alert_level == 'critical':
                        alerts.append({
                            'type': 'suspicious_objects',
                            'severity': 'critical',
                            'description': f"Objets suspects détectés: {object_result.objects_detected}"
                        })
                        risk_factors.append(0.9)
                    elif object_result.alert_level == 'high':
                        alerts.append({
                            'type': 'suspicious_objects',
                            'severity': 'high',
                            'description': f"Objets suspects détectés: {object_result.objects_detected}"
                        })
                        risk_factors.append(0.7)
                        
            except Exception as e:
                logger.warning(f"Erreur lors de la détection d'objets: {e}")
        
        # Analyser l'audio si disponible
        audio_analysis = None
        if request.audio_chunk:
            try:
                audio_result = await analyze_audio(AudioAnalysisRequest(
                    audio_data=request.audio_chunk,
                    duration=1.0  # Durée par défaut
                ), current_user)
                audio_analysis = audio_result
                
                # Vérifier les alertes audio
                if audio_result.suspicious_sounds:
                    alerts.append({
                        'type': 'suspicious_audio',
                        'severity': 'medium',
                        'description': 'Sons suspects détectés'
                    })
                    risk_factors.append(0.5)
                    
            except Exception as e:
                logger.warning(f"Erreur lors de l'analyse audio: {e}")
        
        # Calculer le risque global
        overall_risk = 'low'
        if risk_factors:
            avg_risk = sum(risk_factors) / len(risk_factors)
            if avg_risk >= 0.7:
                overall_risk = 'critical'
            elif avg_risk >= 0.5:
                overall_risk = 'high'
            elif avg_risk >= 0.3:
                overall_risk = 'medium'
        
        return SurveillanceAnalysisResponse(
            session_id=request.session_id,
            timestamp=request.timestamp,
            face_analysis=face_analysis,
            object_analysis=object_analysis,
            audio_analysis=audio_analysis,
            overall_risk=overall_risk,
            alerts=alerts
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de surveillance: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'analyse de surveillance")

@router.get("/models")
async def get_ai_models(current_user: User = Depends(get_current_user)):
    """
    Récupère la liste des modèles IA disponibles
    
    Args:
        current_user: Utilisateur authentifié
        
    Returns:
        Liste des modèles IA
    """
    try:
        models = [
            {
                "id": "face_detection_v1",
                "name": "Face Detection Model",
                "version": "1.0.0",
                "type": "computer_vision",
                "accuracy": 0.95,
                "last_updated": "2025-01-01T00:00:00Z",
                "status": "active"
            },
            {
                "id": "object_detection_v1",
                "name": "Object Detection Model",
                "version": "1.0.0",
                "type": "computer_vision",
                "accuracy": 0.89,
                "last_updated": "2025-01-01T00:00:00Z",
                "status": "active"
            },
            {
                "id": "audio_analysis_v1",
                "name": "Audio Analysis Model",
                "version": "1.0.0",
                "type": "audio_processing",
                "accuracy": 0.82,
                "last_updated": "2025-01-01T00:00:00Z",
                "status": "active"
            }
        ]
        
        return {"models": models}
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des modèles: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des modèles")

@router.get("/health")
async def ai_health_check(current_user: User = Depends(get_current_user)):
    """
    Vérifie l'état des services IA
    
    Args:
        current_user: Utilisateur authentifié
        
    Returns:
        État des services IA
    """
    try:
        # Vérifier les services IA
        services_status = {
            "face_detection": "healthy",
            "object_detection": "healthy",
            "audio_analysis": "healthy"
        }
        
        # Test simple des services
        try:
            # Test du service de reconnaissance faciale
            test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            face_detection_service.detect_faces(face_detection_service.decode_base64_image(test_image))
        except Exception as e:
            services_status["face_detection"] = "error"
            logger.warning(f"Service de reconnaissance faciale en erreur: {e}")
        
        try:
            # Test du service de détection d'objets
            object_detection_service.detect_suspicious_objects(test_image)
        except Exception as e:
            services_status["object_detection"] = "error"
            logger.warning(f"Service de détection d'objets en erreur: {e}")
        
        overall_status = "healthy" if all(status == "healthy" for status in services_status.values()) else "degraded"
        
        return {
            "status": overall_status,
            "services": services_status,
            "timestamp": "2025-01-15T10:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors du health check IA: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du health check IA")
