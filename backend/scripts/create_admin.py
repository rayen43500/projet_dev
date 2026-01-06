"""
Script pour créer un compte administrateur
Usage: python create_admin.py [--email EMAIL] [--username USERNAME] [--password PASSWORD]
"""

import sys
import os
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import engine, Base, User
from app.core.security import get_password_hash
from app.crud.user import get_user_by_email, get_user_by_username, create_user
from app.models.auth import UserCreate

def create_admin_user(
    email: str = "admin@proctoflex.ai",
    username: str = "admin",
    password: str = "admin123",
    full_name: str = "Administrator"
):
    """Crée un compte administrateur"""
    
    # Créer les tables si elles n'existent pas
    Base.metadata.create_all(bind=engine)
    
    # Créer une session
    db = Session(bind=engine)
    
    try:
        # Vérifier si l'utilisateur existe déjà
        existing_user_by_email = get_user_by_email(db, email)
        existing_user_by_username = get_user_by_username(db, username)
        
        if existing_user_by_email:
            print(f"❌ Un utilisateur avec l'email '{email}' existe déjà.")
            return False
        
        if existing_user_by_username:
            print(f"❌ Un utilisateur avec le username '{username}' existe déjà.")
            return False
        
        # Créer l'utilisateur admin
        user_data = UserCreate(
            email=email,
            username=username,
            password=password,
            full_name=full_name,
            role="admin"
        )
        
        user = create_user(db, user_data)
        
        print("✅ Compte administrateur créé avec succès!")
        print(f"   Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Role: {user.role}")
        print(f"   ID: {user.id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du compte admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Créer un compte administrateur")
    parser.add_argument("--email", default="admin@proctoflex.ai", help="Email de l'administrateur")
    parser.add_argument("--username", default="admin", help="Nom d'utilisateur")
    parser.add_argument("--password", default="admin123", help="Mot de passe")
    parser.add_argument("--full-name", default="Administrator", help="Nom complet")
    
    args = parser.parse_args()
    
    print("🔧 Création du compte administrateur...")
    print(f"   Email: {args.email}")
    print(f"   Username: {args.username}")
    print()
    
    success = create_admin_user(
        email=args.email,
        username=args.username,
        password=args.password,
        full_name=args.full_name
    )
    
    if success:
        print()
        print("💡 Vous pouvez maintenant vous connecter avec:")
        print(f"   Email: {args.email}")
        print(f"   Password: {args.password}")
        sys.exit(0)
    else:
        sys.exit(1)

