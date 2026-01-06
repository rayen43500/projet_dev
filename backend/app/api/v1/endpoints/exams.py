"""
Endpoints de gestion des examens ProctoFlex AI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db, User, Exam, exam_students
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
    student_ids: Optional[List[int]] = None  # Liste des IDs d'étudiants à assigner

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
    db.flush()  # Pour obtenir l'ID de l'examen
    
    # Assigner les étudiants si fournis
    if exam_data.student_ids:
        for student_id in exam_data.student_ids:
            student = db.query(User).filter(User.id == student_id, User.role == "student").first()
            if student:
                exam.assigned_students.append(student)
    
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

@router.post("/{exam_id}/assign-students", status_code=status.HTTP_200_OK)
async def assign_students_to_exam(
    exam_id: int,
    student_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assigne des étudiants à un examen
    """
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et instructeurs peuvent assigner des étudiants"
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
    
    # Assigner les étudiants
    assigned_count = 0
    for student_id in student_ids:
        student = db.query(User).filter(User.id == student_id, User.role == "student").first()
        if student and student not in exam.assigned_students:
            exam.assigned_students.append(student)
            assigned_count += 1
    
    db.commit()
    
    return {"message": f"{assigned_count} étudiant(s) assigné(s) avec succès"}

@router.delete("/{exam_id}/students/{student_id}", status_code=status.HTTP_200_OK)
async def remove_student_from_exam(
    exam_id: int,
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retire un étudiant d'un examen
    """
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et instructeurs peuvent retirer des étudiants"
        )
    
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    if student in exam.assigned_students:
        exam.assigned_students.remove(student)
        db.commit()
        return {"message": "Étudiant retiré avec succès"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet étudiant n'est pas assigné à cet examen"
        )

@router.get("/{exam_id}/students", response_model=List[dict])
async def get_exam_students(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des étudiants assignés à un examen
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    # Seuls les admins, instructors et étudiants assignés peuvent voir cette liste
    is_assigned = any(student.id == current_user.id for student in exam.assigned_students)
    if current_user.role not in ["admin", "instructor"] and not is_assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    students = [
        {
            "id": student.id,
            "username": student.username,
            "email": student.email,
            "full_name": student.full_name
        }
        for student in exam.assigned_students
    ]
    
    return students

