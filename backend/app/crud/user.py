"""
Opérations CRUD pour les utilisateurs ProctoFlex AI
"""

from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.core.database import User
from app.models.auth import UserCreate

def get_user_by_email(db: Session, email: str):
    """Récupère un utilisateur par son email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    """Récupère un utilisateur par son nom d'utilisateur"""
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    """Récupère un utilisateur par son ID"""
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user_data: UserCreate):
    """Crée un nouvel utilisateur"""
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_data: dict):
    """Met à jour un utilisateur"""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        for field, value in user_data.items():
            if hasattr(db_user, field):
                setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    """Supprime un utilisateur"""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Récupère une liste d'utilisateurs avec pagination"""
    return db.query(User).offset(skip).limit(limit).all()

def get_users_by_role(db: Session, role: str):
    """Récupère tous les utilisateurs d'un rôle spécifique"""
    return db.query(User).filter(User.role == role).all()
