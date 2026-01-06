"""
Endpoints de gestion des utilisateurs ProctoFlex AI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db, User
from app.core.security import get_current_user
from app.models.auth import User as UserModel, UserUpdate
from app.crud.user import get_user_by_id
from datetime import timezone

router = APIRouter()

# IMPORTANT: L'ordre des routes est crucial !
# Les routes spécifiques (/students) doivent être AVANT les routes avec paramètres (/{user_id})

@router.get("/students", response_model=List[UserModel])
async def get_students(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des étudiants
    Accessible aux admins et instructors
    """
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé. Seuls les admins et instructeurs peuvent accéder à cette ressource."
        )
    
    # Récupérer tous les utilisateurs pour débogage
    all_users = db.query(User).all()
    
    # Log pour débogage
    import logging
    logger = logging.getLogger(__name__)
    
    # Afficher tous les rôles trouvés
    roles_found = set([user.role for user in all_users])
    logger.info(f"Rôles trouvés dans la base: {roles_found}")
    logger.info(f"Utilisateur connecté: {current_user.username}, Rôle: {current_user.role}")
    
    # Filtrer les étudiants (insensible à la casse et avec différentes variantes)
    from sqlalchemy import func, or_
    students = db.query(User).filter(
        or_(
            func.lower(User.role) == "student",
            func.lower(User.role) == "étudiant",
            User.role == "student",
            User.role == "Étudiant",
            User.role == "STUDENT"
        ),
        User.is_active == True
    ).offset(skip).limit(limit).all()
    
    logger.info(f"Nombre d'étudiants trouvés: {len(students)}")
    if students:
        logger.info(f"Étudiants: {[s.username for s in students]}")
    
    return students

@router.get("", response_model=List[UserModel])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des utilisateurs
    Seuls les admins peuvent voir tous les utilisateurs
    """
    # Vérifier que l'utilisateur est admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent accéder à cette ressource"
        )
    
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserModel)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère un utilisateur par son ID
    """
    # Un utilisateur peut voir son propre profil, ou un admin peut voir n'importe quel profil
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return user

@router.put("/{user_id}", response_model=UserModel)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour un utilisateur
    """
    # Un utilisateur peut modifier son propre profil, ou un admin peut modifier n'importe quel profil
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Mise à jour des champs
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime un utilisateur
    Seuls les admins peuvent supprimer des utilisateurs
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent supprimer des utilisateurs"
        )
    
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Ne pas permettre la suppression de soi-même
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "Utilisateur supprimé avec succès"}

