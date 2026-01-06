"""
Script pour créer des utilisateurs de test dans la base de données
"""

import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.database import User

def create_test_users():
    """Crée des utilisateurs de test"""
    # Créer les tables si elles n'existent pas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Créer un admin
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@proctoflex.ai",
                full_name="Administrateur",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            print("✓ Admin créé: admin / admin123")
        
        # Créer un instructeur
        instructor = db.query(User).filter(User.username == "instructor").first()
        if not instructor:
            instructor = User(
                username="instructor",
                email="instructor@proctoflex.ai",
                full_name="Professeur Dupont",
                hashed_password=get_password_hash("instructor123"),
                role="instructor",
                is_active=True
            )
            db.add(instructor)
            print("✓ Instructeur créé: instructor / instructor123")
        
        # Créer quelques étudiants
        students_data = [
            {"username": "student1", "email": "student1@example.com", "full_name": "Jean Dupont"},
            {"username": "student2", "email": "student2@example.com", "full_name": "Marie Martin"},
            {"username": "student3", "email": "student3@example.com", "full_name": "Pierre Dubois"},
            {"username": "student4", "email": "student4@example.com", "full_name": "Sophie Bernard"},
            {"username": "student5", "email": "student5@example.com", "full_name": "Luc Moreau"},
        ]
        
        for student_data in students_data:
            student = db.query(User).filter(User.username == student_data["username"]).first()
            if not student:
                student = User(
                    username=student_data["username"],
                    email=student_data["email"],
                    full_name=student_data["full_name"],
                    hashed_password=get_password_hash("student123"),
                    role="student",
                    is_active=True
                )
                db.add(student)
                print(f"✓ Étudiant créé: {student_data['username']} / student123")
        
        db.commit()
        print("\n✓ Tous les utilisateurs de test ont été créés avec succès!")
        print("\nIdentifiants de connexion:")
        print("  Admin: admin / admin123")
        print("  Instructeur: instructor / instructor123")
        print("  Étudiant: student1 / student123")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Erreur lors de la création des utilisateurs: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()

