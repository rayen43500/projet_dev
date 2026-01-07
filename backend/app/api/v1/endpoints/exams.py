"""
Endpoints de gestion des examens ProctoFlex AI
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db, User, Exam, ExamSession, exam_students
from app.core.security import get_current_user
from pydantic import BaseModel
from datetime import datetime, timezone
from fastapi.responses import FileResponse
from app.core.config import settings
import os
import shutil

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
    instructions: Optional[str] = None
    pdf_filename: Optional[str] = None
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
    instructions: Optional[str] = None
    pdf_filename: Optional[str] = None
    pdf_path: Optional[str] = None
    is_active: bool
    created_at: datetime
    assigned_students_count: Optional[int] = None  # Nombre d'étudiants assignés
    exam_status: Optional[str] = None  # assigned, started, completed (pour compatibilité desktop)
    assigned_at: Optional[str] = None  # Date d'assignation (pour compatibilité desktop)

    class Config:
        from_attributes = True


def _get_exam_or_404(db: Session, exam_id: int) -> Exam:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return exam

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
        instructions=exam_data.instructions,
        pdf_filename=exam_data.pdf_filename,
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
    Pour les étudiants, retourne uniquement leurs examens assignés
    Pour les admins/instructeurs, retourne tous les examens
    """
    if current_user.role == "student":
        # Pour les étudiants, retourner uniquement les examens assignés
        exams = db.query(Exam).join(Exam.assigned_students).filter(
            User.id == current_user.id
        ).offset(skip).limit(limit).all()
    else:
        # Pour les admins/instructeurs, retourner tous les examens
        exams = db.query(Exam).offset(skip).limit(limit).all()
    
    # Mapper avec le nombre d'étudiants assignés et ajouter exam_status pour compatibilité desktop
    result = []
    for exam in exams:
        # Déterminer le statut basé sur les sessions actives
        active_sessions = db.query(ExamSession).filter(
            ExamSession.exam_id == exam.id,
            ExamSession.status == "active"
        ).count()
        
        exam_status = "assigned"  # Par défaut
        if active_sessions > 0:
            exam_status = "started"
        
        # Vérifier s'il y a des sessions terminées
        completed_sessions = db.query(ExamSession).filter(
            ExamSession.exam_id == exam.id,
            ExamSession.status == "completed"
        ).count()
        
        if completed_sessions > 0 and active_sessions == 0:
            exam_status = "completed"
        
        exam_dict = {
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "duration_minutes": exam.duration_minutes,
            "start_time": exam.start_time,
            "end_time": exam.end_time,
            "student_id": exam.student_id,
            "instructor_id": exam.instructor_id,
            "allowed_apps": exam.allowed_apps,
            "allowed_domains": exam.allowed_domains,
            "instructions": getattr(exam, 'instructions', None),
            "pdf_filename": getattr(exam, 'pdf_filename', None),
            "pdf_path": getattr(exam, 'pdf_path', None),
            "is_active": exam.is_active,
            "created_at": exam.created_at,
            "assigned_students_count": len(exam.assigned_students) if exam.assigned_students else 0,
            "exam_status": exam_status,  # Pour compatibilité desktop
            "assigned_at": exam.created_at.isoformat() if exam.created_at else None  # Pour compatibilité desktop
        }
        result.append(ExamResponse(**exam_dict))
    
    return result

@router.get("/student/{student_id}", response_model=List[ExamResponse])
async def get_student_exams(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les examens assignés à un étudiant spécifique
    Un étudiant peut voir uniquement ses propres examens
    Les admins/instructeurs peuvent voir les examens de n'importe quel étudiant
    """
    # Vérifier les permissions
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez voir que vos propres examens"
        )
    
    # Récupérer les examens assignés à cet étudiant
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    # Récupérer les examens via la relation many-to-many
    exams = db.query(Exam).join(Exam.assigned_students).filter(
        User.id == student_id
    ).all()
    
    # Mapper avec le nombre d'étudiants assignés et les champs additionnels
    result = []
    for exam in exams:
        exam_dict = {
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "duration_minutes": exam.duration_minutes,
            "start_time": exam.start_time,
            "end_time": exam.end_time,
            "student_id": exam.student_id,
            "instructor_id": exam.instructor_id,
            "allowed_apps": exam.allowed_apps,
            "allowed_domains": exam.allowed_domains,
            "instructions": getattr(exam, 'instructions', None),
            "pdf_filename": getattr(exam, 'pdf_filename', None),
            "pdf_path": getattr(exam, 'pdf_path', None),
            "is_active": exam.is_active,
            "created_at": exam.created_at,
            "assigned_students_count": len(exam.assigned_students) if exam.assigned_students else 0
        }
        result.append(ExamResponse(**exam_dict))
    
    return result

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
    
    # Retourner avec le nombre d'étudiants assignés
    return ExamResponse(
        id=exam.id,
        title=exam.title,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        start_time=exam.start_time,
        end_time=exam.end_time,
        student_id=exam.student_id,
        instructor_id=exam.instructor_id,
        allowed_apps=exam.allowed_apps,
        allowed_domains=exam.allowed_domains,
        instructions=getattr(exam, 'instructions', None),
        pdf_filename=getattr(exam, 'pdf_filename', None),
        pdf_path=getattr(exam, 'pdf_path', None),
        is_active=exam.is_active,
        created_at=exam.created_at,
        assigned_students_count=len(exam.assigned_students) if exam.assigned_students else 0
    )


@router.post("/{exam_id}/material", status_code=status.HTTP_200_OK)
async def upload_exam_material(
    exam_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload du PDF d'un examen.

    - Seuls les admins et instructeurs peuvent uploader un PDF
    - Le fichier est stocké dans le dossier d'uploads configuré
    """
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et instructeurs peuvent téléverser des documents d'examen",
        )

    exam = _get_exam_or_404(db, exam_id)

    # Vérifier le type de fichier
    if file.content_type not in ["application/pdf", "application/octet-stream"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les fichiers PDF sont autorisés",
        )

    # S'assurer que le dossier d'upload existe
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    # Générer un nom de fichier unique
    safe_filename = file.filename or f"exam_{exam_id}.pdf"
    _, ext = os.path.splitext(safe_filename)
    if ext.lower() != ".pdf":
        ext = ".pdf"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    final_filename = f"exam_{exam_id}_{timestamp}{ext}"
    file_path = os.path.join(upload_dir, final_filename)

    # Sauvegarder le fichier sur le disque
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()

    # Mettre à jour l'examen avec les infos du PDF
    exam.pdf_filename = final_filename
    exam.pdf_path = file_path
    db.commit()
    db.refresh(exam)

    return {
        "message": "Document PDF téléchargé avec succès",
        "pdf_filename": exam.pdf_filename,
        "pdf_path": exam.pdf_path,
    }


def _ensure_exam_material_access(exam: Exam, current_user: User):
    """
    Vérifie que l'utilisateur a le droit d'accéder au PDF de l'examen.
    - Admin & instructeur propriétaire : ok
    - Étudiant : seulement si assigné à cet examen
    """
    if current_user.role in ["admin"]:
        return

    if current_user.role == "instructor":
        if exam.instructor_id == current_user.id:
            return
        # Instructeur non propriétaire -> refus
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à accéder à ce document d'examen",
        )

    if current_user.role == "student":
        if current_user in exam.assigned_students:
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à accéder à ce document d'examen",
        )

    # Rôles inconnus
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès non autorisé",
    )


def _resolve_pdf_path(exam: Exam) -> str:
    """
    Détermine le chemin réel du PDF à partir des champs de l'examen.
    """
    # Chemin complet déjà stocké
    if exam.pdf_path and os.path.isfile(exam.pdf_path):
        return exam.pdf_path

    # Sinon, essayer avec pdf_filename dans UPLOAD_DIR
    if exam.pdf_filename:
        candidate = os.path.join(settings.UPLOAD_DIR, exam.pdf_filename)
        if os.path.isfile(candidate):
            return candidate

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Aucun document PDF disponible pour cet examen",
    )


@router.get("/{exam_id}/material")
async def get_exam_material(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Récupère le PDF d'un examen (téléchargement / consommation par les apps).
    """
    exam = _get_exam_or_404(db, exam_id)
    _ensure_exam_material_access(exam, current_user)

    pdf_path = _resolve_pdf_path(exam)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=exam.pdf_filename or os.path.basename(pdf_path),
    )


@router.get("/{exam_id}/view")
async def view_exam_material(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Affiche le PDF d'un examen dans le navigateur (inline).
    Utilisé notamment par les viewers PDF.
    """
    exam = _get_exam_or_404(db, exam_id)
    _ensure_exam_material_access(exam, current_user)

    pdf_path = _resolve_pdf_path(exam)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=exam.pdf_filename or os.path.basename(pdf_path),
    )

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

@router.post("/{exam_id}/start")
async def start_exam(
    exam_id: int,
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Démarre un examen pour un étudiant
    Crée une session d'examen
    """
    # Vérifier que l'utilisateur est l'étudiant concerné ou un admin/instructor
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez démarrer que vos propres examens"
        )
    
    # Vérifier que l'examen existe
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    # Vérifier que l'étudiant est assigné à cet examen
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    if student not in exam.assigned_students:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cet étudiant n'est pas assigné à cet examen"
        )
    
    # Vérifier s'il existe déjà une session active pour cet examen et cet étudiant
    existing_session = db.query(ExamSession).filter(
        ExamSession.exam_id == exam_id,
        ExamSession.student_id == student_id,
        ExamSession.status == "active"
    ).first()
    
    if existing_session:
        # Retourner la session existante
        return {
            "session_id": existing_session.id,
            "message": "Session déjà active",
            "status": "active"
        }
    
    # Créer une nouvelle session
    session = ExamSession(
        exam_id=exam_id,
        student_id=student_id,
        status="active",
        start_time=datetime.now(timezone.utc)
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "session_id": session.id,
        "message": "Examen démarré avec succès",
        "status": "active"
    }

@router.post("/{exam_id}/submit")
async def submit_exam(
    exam_id: int,
    student_id: int,
    answers: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soumet un examen (termine la session)
    """
    # Vérifier que l'utilisateur est l'étudiant concerné ou un admin/instructor
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez soumettre que vos propres examens"
        )
    
    # Trouver la session active
    session = db.query(ExamSession).filter(
        ExamSession.exam_id == exam_id,
        ExamSession.student_id == student_id,
        ExamSession.status == "active"
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune session active trouvée pour cet examen"
        )
    
    # Terminer la session
    session.status = "completed"
    session.end_time = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Examen soumis avec succès",
        "session_id": session.id,
        "status": "completed"
    }

