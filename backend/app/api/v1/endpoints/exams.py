"""
Endpoints de gestion des examens ProctoFlex AI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db, User, Exam
from app.core.security import get_current_user
from pydantic import BaseModel

router = APIRouter()

# Modèles Pydantic
class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    allowed_apps: Optional[List[str]] = None
    allowed_domains: Optional[List[str]] = None

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    allowed_apps: Optional[List[str]] = None
    allowed_domains: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ExamResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    student_id: Optional[int]
    instructor_id: Optional[int]
    allowed_apps: Optional[str]
    allowed_domains: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_data: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crée un nouvel examen
    Seuls les admins et instructors peuvent créer des examens
    """
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et instructeurs peuvent créer des examens"
        )
    
    # Convertir les listes en JSON strings pour le stockage
    allowed_apps_json = None
    allowed_domains_json = None
    
    if exam_data.allowed_apps:
        import json
        allowed_apps_json = json.dumps(exam_data.allowed_apps)
    
    if exam_data.allowed_domains:
        import json
        allowed_domains_json = json.dumps(exam_data.allowed_domains)
    
    # Créer l'examen
    exam = Exam(
        title=exam_data.title,
        description=exam_data.description,
        duration_minutes=exam_data.duration_minutes,
        start_time=exam_data.start_time,
        end_time=exam_data.end_time,
        instructor_id=current_user.id,
        allowed_apps=allowed_apps_json,
        allowed_domains=allowed_domains_json,
        is_active=True
    )
    
    db.add(exam)
    db.commit()
    db.refresh(exam)
    
    return exam

@router.get("", response_model=List[ExamResponse])
async def get_exams(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des examens
    """
    exams = db.query(Exam).offset(skip).limit(limit).all()
    return exams

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère un examen par son ID
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return exam

@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour un examen
    Seuls les admins et instructors peuvent modifier des examens
    """
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et instructeurs peuvent modifier des examens"
        )
    
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    # Vérifier que l'utilisateur est le propriétaire ou un admin
    if exam.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier cet examen"
        )
    
    # Mettre à jour les champs
    update_data = exam_data.dict(exclude_unset=True)
    
    # Convertir les listes en JSON si présentes
    if "allowed_apps" in update_data and update_data["allowed_apps"] is not None:
        import json
        update_data["allowed_apps"] = json.dumps(update_data["allowed_apps"])
    
    if "allowed_domains" in update_data and update_data["allowed_domains"] is not None:
        import json
        update_data["allowed_domains"] = json.dumps(update_data["allowed_domains"])
    
    for field, value in update_data.items():
        setattr(exam, field, value)
    
    db.commit()
    db.refresh(exam)
    
    return exam

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime un examen
    Seuls les admins et instructors peuvent supprimer des examens
    """
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et instructeurs peuvent supprimer des examens"
        )
    
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    # Vérifier que l'utilisateur est le propriétaire ou un admin
    if exam.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à supprimer cet examen"
        )
    
    db.delete(exam)
    db.commit()
    
    return None

