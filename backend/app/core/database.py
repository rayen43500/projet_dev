"""
Configuration de la base de données ProctoFlex AI
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.core.config import settings

# Création de l'engine de base de données
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# Modèles de base de données
class User(Base):
    """Modèle utilisateur (étudiant ou administrateur)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student")  # student, admin, instructor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    exams_as_student = relationship("Exam", foreign_keys="Exam.student_id", back_populates="student")
    exams_as_instructor = relationship("Exam", foreign_keys="Exam.instructor_id", back_populates="instructor")
    sessions = relationship("ExamSession", back_populates="student")

class Exam(Base):
    """Modèle d'examen"""
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"))
    instructor_id = Column(Integer, ForeignKey("users.id"))
    allowed_apps = Column(Text)  # JSON string des applications autorisées
    allowed_domains = Column(Text)  # JSON string des domaines web autorisés
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    student = relationship("User", foreign_keys=[student_id], back_populates="exams_as_student")
    instructor = relationship("User", foreign_keys=[instructor_id], back_populates="exams_as_instructor")
    sessions = relationship("ExamSession", back_populates="exam")

class ExamSession(Base):
    """Modèle de session d'examen"""
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    status = Column(String, default="active")  # active, completed, terminated
    video_path = Column(String)
    audio_path = Column(String)
    screen_captures = Column(Text)  # JSON string des captures d'écran
    
    # Relations
    exam = relationship("Exam", back_populates="sessions")
    student = relationship("User", back_populates="sessions")
    alerts = relationship("SecurityAlert", back_populates="session")

class SecurityAlert(Base):
    """Modèle d'alerte de sécurité"""
    __tablename__ = "security_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"))
    alert_type = Column(String, nullable=False)  # face_detection, audio, screen, gaze
    severity = Column(String, default="medium")  # low, medium, high, critical
    description = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_resolved = Column(Boolean, default=False)
    
    # Relations
    session = relationship("ExamSession", back_populates="alerts")

# Fonction pour obtenir la session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
