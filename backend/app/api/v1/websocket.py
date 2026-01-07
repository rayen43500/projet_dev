"""
WebSocket endpoints pour les alertes en temps réel
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import logging
from sqlalchemy.orm import Session

from app.core.database import SecurityAlert, ExamSession
from app.core.security import verify_token
from app.core.database import SessionLocal, User

logger = logging.getLogger(__name__)

# Gestionnaire de connexions WebSocket
class ConnectionManager:
    def __init__(self):
        # Dictionnaire : user_id -> Set[WebSocket]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Dictionnaire : exam_id -> Set[WebSocket]
        self.exam_connections: Dict[int, Set[WebSocket]] = {}
        # Dictionnaire : session_id -> Set[WebSocket]
        self.session_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connecté pour l'utilisateur {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Nettoyer les connexions d'examens
        for exam_id, connections in self.exam_connections.items():
            connections.discard(websocket)
            if not connections:
                del self.exam_connections[exam_id]
        
        # Nettoyer les connexions de sessions
        for session_id, connections in self.session_connections.items():
            connections.discard(websocket)
            if not connections:
                del self.session_connections[session_id]
        
        logger.info(f"WebSocket déconnecté pour l'utilisateur {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Nettoyer les connexions déconnectées
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def send_to_exam(self, message: dict, exam_id: int):
        if exam_id in self.exam_connections:
            disconnected = set()
            for connection in self.exam_connections[exam_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Nettoyer les connexions déconnectées
            for conn in disconnected:
                self.exam_connections[exam_id].discard(conn)
    
    async def send_to_session(self, message: dict, session_id: int):
        if session_id in self.session_connections:
            disconnected = set()
            for connection in self.session_connections[session_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Nettoyer les connexions déconnectées
            for conn in disconnected:
                self.session_connections[session_id].discard(conn)
    
    def subscribe_to_exam(self, websocket: WebSocket, exam_id: int):
        if exam_id not in self.exam_connections:
            self.exam_connections[exam_id] = set()
        self.exam_connections[exam_id].add(websocket)
    
    def subscribe_to_session(self, websocket: WebSocket, session_id: int):
        if session_id not in self.session_connections:
            self.session_connections[session_id] = set()
        self.session_connections[session_id].add(websocket)

# Instance globale du gestionnaire
manager = ConnectionManager()

async def send_alert_to_connections(alert: SecurityAlert, db: Session):
    """
    Envoie une alerte à tous les WebSockets concernés
    """
    # Préparer le message
    message = {
        "type": "alert",
        "alert": {
            "id": alert.id,
            "session_id": alert.session_id,
            "exam_id": None,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "description": alert.description,
            "timestamp": alert.timestamp.isoformat() if alert.timestamp else None,
            "is_resolved": alert.is_resolved
        }
    }
    
    # Récupérer la session et l'examen si session_id existe
    session = None
    if alert.session_id:
        session = db.query(ExamSession).filter(ExamSession.id == alert.session_id).first()
        if session:
            message["alert"]["exam_id"] = session.exam_id
            
            # Envoyer à tous ceux qui suivent cette session
            await manager.send_to_session(message, alert.session_id)
            
            # Envoyer à tous ceux qui suivent cet examen (admin/instructeur)
            await manager.send_to_exam(message, session.exam_id)
            
            # Envoyer à l'étudiant concerné
            await manager.send_personal_message(message, session.student_id)
    
    # Envoyer à TOUS les admins/instructeurs connectés (pour le dashboard)
    # Même si pas de session, les admins doivent voir toutes les alertes
    admin_users = db.query(User).filter(User.role.in_(["admin", "instructor"])).all()
    for admin_user in admin_users:
        await manager.send_personal_message(message, admin_user.id)

# Fonction pour obtenir l'utilisateur depuis le token WebSocket
async def get_user_from_websocket(websocket: WebSocket, token: str = None):
    """
    Authentifie l'utilisateur via WebSocket
    """
    from app.core.security import verify_token
    from app.core.database import SessionLocal, User
    
    if not token:
        # Essayer de récupérer depuis le query parameter
        query_params = dict(websocket.query_params)
        token = query_params.get("token")
    
    if not token:
        await websocket.close(code=4001, reason="Token manquant")
        return None
    
    try:
        payload = verify_token(token)
        if payload is None:
            await websocket.close(code=4003, reason="Token invalide")
            return None
        
        username = payload.get("sub")
        if username is None:
            await websocket.close(code=4003, reason="Token invalide")
            return None
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            return user
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Erreur d'authentification WebSocket: {e}")
        await websocket.close(code=4003, reason="Token invalide")
        return None

# Endpoint WebSocket principal
async def websocket_endpoint(websocket: WebSocket):
    """
    Endpoint WebSocket pour les alertes en temps réel
    """
    user = None
    user_id = None
    
    try:
        # Authentification
        token = websocket.query_params.get("token")
        user = await get_user_from_websocket(websocket, token)
        
        if not user:
            return
        
        user_id = user.id
        await manager.connect(websocket, user_id)
        
        # Si l'utilisateur est admin/instructeur, s'abonner automatiquement à toutes les sessions actives
        if user.role in ["admin", "instructor"]:
            db_session = SessionLocal()
            try:
                from app.core.database import ExamSession
                active_sessions = db_session.query(ExamSession).filter(ExamSession.status == "active").all()
                for session in active_sessions:
                    manager.subscribe_to_session(websocket, session.id)
                    manager.subscribe_to_exam(websocket, session.exam_id)
                logger.info(f"Admin/Instructeur {user_id} abonné à {len(active_sessions)} sessions actives")
            finally:
                db_session.close()
        
        # Envoyer un message de bienvenue
        await websocket.send_json({
            "type": "connected",
            "message": "Connexion WebSocket établie",
            "user_id": user_id,
            "role": user.role
        })
        
        # Écouter les messages du client
        while True:
            try:
                data = await websocket.receive_json()
                
                # Gérer les abonnements
                if data.get("type") == "subscribe_exam":
                    exam_id = data.get("exam_id")
                    if exam_id:
                        manager.subscribe_to_exam(websocket, exam_id)
                        await websocket.send_json({
                            "type": "subscribed",
                            "exam_id": exam_id
                        })
                
                elif data.get("type") == "subscribe_session":
                    session_id = data.get("session_id")
                    if session_id:
                        manager.subscribe_to_session(websocket, session_id)
                        await websocket.send_json({
                            "type": "subscribed",
                            "session_id": session_id
                        })
                
                elif data.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong"
                    })
                    
            except Exception as e:
                logger.error(f"Erreur lors du traitement du message WebSocket: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket déconnecté pour l'utilisateur {user_id}")
    except Exception as e:
        logger.error(f"Erreur WebSocket: {e}")
    finally:
        if user_id:
            manager.disconnect(websocket, user_id)

