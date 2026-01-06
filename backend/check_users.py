"""
Script pour vérifier les utilisateurs dans la base de données
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, User

def check_users():
    """Affiche tous les utilisateurs et leurs rôles"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        
        print(f"\n{'='*60}")
        print(f"Total d'utilisateurs: {len(users)}")
        print(f"{'='*60}\n")
        
        if not users:
            print("Aucun utilisateur trouvé dans la base de données")
            return
        
        # Grouper par rôle
        roles_count = {}
        for user in users:
            role = user.role
            if role not in roles_count:
                roles_count[role] = []
            roles_count[role].append(user)
        
        print("Utilisateurs par rôle:\n")
        for role, user_list in roles_count.items():
            print(f"  Rôle: '{role}' ({len(user_list)} utilisateur(s))")
            for user in user_list:
                print(f"    - {user.username} ({user.email}) - Actif: {user.is_active}")
            print()
        
        # Vérifier les étudiants
        print(f"\n{'='*60}")
        print("Vérification des étudiants:")
        print(f"{'='*60}\n")
        
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
        ).all()
        
        print(f"Étudiants trouvés (avec filtres): {len(students)}")
        for student in students:
            print(f"  - {student.username} ({student.email}) - Rôle: '{student.role}'")
        
        # Afficher les valeurs exactes des rôles
        print(f"\n{'='*60}")
        print("Valeurs exactes des rôles (pour débogage):")
        print(f"{'='*60}\n")
        unique_roles = set([user.role for user in users])
        for role in unique_roles:
            print(f"  '{role}' (longueur: {len(role)}, repr: {repr(role)})")
        
    except Exception as e:
        print(f"Erreur: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()

