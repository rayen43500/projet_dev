# Configuration complète de ProctoFlex AI

## Problèmes résolus

### 1. Ordre des routes FastAPI
✅ **Corrigé** : Les routes spécifiques (`/users/students`) doivent être déclarées **AVANT** les routes avec paramètres (`/users/{user_id}`) pour éviter les conflits.

### 2. Authentification (401 Unauthorized)
Si vous recevez des erreurs 401, vérifiez :
- Que le token est présent dans le localStorage (`localStorage.getItem('auth_token')`)
- Que le token n'est pas expiré
- Que vous êtes bien connecté

### 3. Base de données vide
Pour créer des utilisateurs de test, exécutez :

```bash
cd backend
python create_test_users.py
```

Cela créera :
- **Admin**: `admin` / `admin123`
- **Instructeur**: `instructor` / `instructor123`
- **Étudiants**: `student1` à `student5` / `student123`

## Configuration Backend

### 1. Installer les dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 2. Créer les utilisateurs de test
```bash
python create_test_users.py
```

### 3. Démarrer le serveur
```bash
python main.py
# ou
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Configuration Frontend

### 1. Installer les dépendances
```bash
cd frontend
npm install
```

### 2. Variables d'environnement
Créez un fichier `.env` dans `frontend/` :
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### 3. Démarrer le frontend
```bash
npm run dev
```

## Configuration Desktop

### 1. Installer les dépendances
```bash
cd desktop
npm install
```

### 2. Démarrer l'application desktop
```bash
npm run dev
```

## Tests de connexion

### 1. Se connecter comme Admin/Instructeur
- URL: http://localhost:5173 (ou le port du frontend)
- Identifiant: `admin` ou `instructor`
- Mot de passe: `admin123` ou `instructor123`

### 2. Créer un examen
1. Aller dans "Examens" > "Nouvel Examen"
2. Remplir le formulaire
3. Dans "Étudiants assignés", vous devriez voir la liste des étudiants

### 3. Vérifier les alertes
- Dashboard: Panneau d'alertes en temps réel
- Page Alertes: Historique complet des alertes

## Structure de la base de données

### Tables principales
- `users` : Utilisateurs (admin, instructor, student)
- `exams` : Examens
- `exam_students` : Relation many-to-many examens-étudiants
- `exam_sessions` : Sessions d'examen
- `security_alerts` : Alertes de sécurité

## Endpoints API importants

### Authentification
- `POST /api/v1/auth/login` : Connexion
- `POST /api/v1/auth/register` : Inscription
- `GET /api/v1/auth/me` : Informations utilisateur

### Utilisateurs
- `GET /api/v1/users/students` : Liste des étudiants (admin/instructor)
- `GET /api/v1/users` : Liste de tous les utilisateurs (admin)

### Examens
- `GET /api/v1/exams` : Liste des examens
- `POST /api/v1/exams` : Créer un examen
- `POST /api/v1/exams/{id}/assign-students` : Assigner des étudiants
- `GET /api/v1/exams/{id}/students` : Étudiants assignés

### Surveillance
- `GET /api/v1/surveillance/alerts/recent` : Alertes récentes
- `GET /api/v1/surveillance/sessions/active` : Sessions actives
- `POST /api/v1/surveillance/analyze` : Analyser une session

### WebSocket
- `WS /ws?token=...` : Connexion WebSocket pour alertes en temps réel

## Dépannage

### Erreur 401 (Unauthorized)
- Vérifiez que vous êtes connecté
- Vérifiez que le token dans localStorage est valide
- Essayez de vous reconnecter

### Erreur 422 (Unprocessable Entity)
- Vérifiez le format des données envoyées
- Vérifiez que tous les champs requis sont présents

### Aucun étudiant trouvé
1. Exécutez `python backend/create_test_users.py`
2. Vérifiez que vous êtes connecté comme admin ou instructor
3. Vérifiez dans la console du navigateur les erreurs réseau

### WebSocket ne se connecte pas
- Vérifiez que le backend est démarré
- Vérifiez que l'URL WebSocket est correcte dans `.env`
- Vérifiez que le token est valide

## Prochaines étapes

1. ✅ Créer des utilisateurs de test
2. ✅ Se connecter comme admin/instructor
3. ✅ Créer un examen avec étudiants assignés
4. ✅ Tester le système d'alertes
5. ✅ Tester le WebSocket pour les alertes en temps réel

