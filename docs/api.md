# Documentation API - ProctoFlex AI

## Table des matières
1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Endpoints Utilisateurs](#endpoints-utilisateurs)
4. [Endpoints Examens](#endpoints-examens)
5. [Endpoints Surveillance](#endpoints-surveillance)
6. [Endpoints IA](#endpoints-ia)
7. [WebSocket Events](#websocket-events)
8. [Codes d'Erreur](#codes-derreur)
9. [Exemples](#exemples)

## 1. Introduction

L'API ProctoFlex AI est une API RESTful construite avec FastAPI qui permet la gestion des examens en ligne avec surveillance intelligente.

### 1.1 Informations de Base

- **Base URL** : `https://api.proctoflex.ai/v1`
- **Version** : 1.0.0
- **Format** : JSON
- **Authentification** : JWT Bearer Token
- **Rate Limiting** : 1000 requêtes/heure par utilisateur

### 1.2 Endpoints Principaux

```
GET    /health                    # Vérification de l'état du serveur
POST   /auth/login               # Authentification
POST   /auth/register            # Inscription
GET    /users/me                 # Profil utilisateur
GET    /exams                    # Liste des examens
POST   /exams                    # Créer un examen
GET    /exams/{id}               # Détails d'un examen
POST   /exams/{id}/start         # Démarrer un examen
POST   /exams/{id}/submit        # Soumettre un examen
GET    /surveillance/sessions    # Sessions actives
POST   /ai/analyze               # Analyse IA
```

## 2. Authentification

### 2.1 Login

**POST** `/auth/login`

Authentification utilisateur avec email et mot de passe.

```json
{
  "email": "etudiant@esprim.tn",
  "password": "motdepasse123"
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 123,
    "email": "etudiant@esprim.tn",
    "role": "student",
    "name": "Jean Dupont"
  }
}
```

### 2.2 Register

**POST** `/auth/register`

Inscription d'un nouvel utilisateur.

```json
{
  "email": "nouveau@esprim.tn",
  "password": "motdepasse123",
  "name": "Marie Martin",
  "role": "student",
  "student_id": "DS2A001"
}
```

### 2.3 Refresh Token

**POST** `/auth/refresh`

Renouvellement du token d'accès.

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 3. Endpoints Utilisateurs

### 3.1 Profil Utilisateur

**GET** `/users/me`

Récupération du profil de l'utilisateur connecté.

**Headers :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "id": 123,
  "email": "etudiant@esprim.tn",
  "name": "Jean Dupont",
  "role": "student",
  "student_id": "DS2A001",
  "created_at": "2025-01-01T10:00:00Z",
  "last_login": "2025-01-15T14:30:00Z"
}
```

### 3.2 Mise à Jour du Profil

**PUT** `/users/me`

Mise à jour du profil utilisateur.

```json
{
  "name": "Jean Dupont",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### 3.3 Changement de Mot de Passe

**POST** `/users/me/change-password`

```json
{
  "current_password": "ancienmotdepasse",
  "new_password": "nouveaumotdepasse"
}
```

## 4. Endpoints Examens

### 4.1 Liste des Examens

**GET** `/exams`

Récupération de la liste des examens disponibles.

**Paramètres de requête :**
- `status` : `upcoming`, `active`, `completed`
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20)

**Réponse :**
```json
{
  "exams": [
    {
      "id": 1,
      "title": "Examen Final - Programmation",
      "description": "Examen pratique de programmation Java",
      "start_time": "2025-01-15T09:00:00Z",
      "end_time": "2025-01-15T12:00:00Z",
      "duration": 180,
      "status": "upcoming",
      "allowed_apps": ["vscode.exe", "java.exe"],
      "allowed_domains": ["docs.oracle.com"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### 4.2 Création d'Examen

**POST** `/exams`

Création d'un nouvel examen (instructeurs uniquement).

```json
{
  "title": "Examen Final - Programmation",
  "description": "Examen pratique de programmation Java",
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T12:00:00Z",
  "duration": 180,
  "allowed_apps": ["vscode.exe", "java.exe", "eclipse.exe"],
  "allowed_domains": ["docs.oracle.com", "stackoverflow.com"],
  "surveillance_level": "standard",
  "identity_verification": true,
  "recording": {
    "video": true,
    "audio": true,
    "screen": true
  }
}
```

### 4.3 Détails d'Examen

**GET** `/exams/{id}`

Récupération des détails d'un examen spécifique.

**Réponse :**
```json
{
  "id": 1,
  "title": "Examen Final - Programmation",
  "description": "Examen pratique de programmation Java",
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T12:00:00Z",
  "duration": 180,
  "status": "upcoming",
  "allowed_apps": ["vscode.exe", "java.exe"],
  "allowed_domains": ["docs.oracle.com"],
  "surveillance_level": "standard",
  "identity_verification": true,
  "recording": {
    "video": true,
    "audio": true,
    "screen": true
  },
  "instructions": "Instructions détaillées pour l'examen...",
  "created_by": {
    "id": 456,
    "name": "Prof. Martin"
  }
}
```

### 4.4 Démarrage d'Examen

**POST** `/exams/{id}/start`

Démarrage d'une session d'examen.

```json
{
  "identity_verification": {
    "face_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "id_document": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  },
  "system_info": {
    "os": "Windows 11",
    "browser": "Chrome 120.0.0.0",
    "screen_resolution": "1920x1080",
    "webcam_available": true,
    "microphone_available": true
  }
}
```

**Réponse :**
```json
{
  "session_id": "sess_123456789",
  "exam_id": 1,
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T12:00:00Z",
  "time_remaining": 10800,
  "surveillance_config": {
    "video_recording": true,
    "audio_recording": true,
    "screen_recording": true,
    "face_detection": true,
    "object_detection": true
  }
}
```

### 4.5 Soumission d'Examen

**POST** `/exams/{id}/submit`

Soumission d'un examen terminé.

```json
{
  "session_id": "sess_123456789",
  "submission_time": "2025-01-15T11:45:00Z",
  "files": [
    {
      "name": "solution.java",
      "content": "public class Solution { ... }",
      "type": "source_code"
    }
  ]
}
```

## 5. Endpoints Surveillance

### 5.1 Sessions Actives

**GET** `/surveillance/sessions`

Récupération des sessions de surveillance actives.

**Réponse :**
```json
{
  "sessions": [
    {
      "session_id": "sess_123456789",
      "exam_id": 1,
      "user_id": 123,
      "user_name": "Jean Dupont",
      "start_time": "2025-01-15T09:00:00Z",
      "time_remaining": 7200,
      "status": "active",
      "alerts": [
        {
          "id": "alert_001",
          "type": "face_not_detected",
          "severity": "warning",
          "timestamp": "2025-01-15T10:30:00Z",
          "description": "Visage non détecté pendant 30 secondes"
        }
      ]
    }
  ]
}
```

### 5.2 Envoi de Données de Surveillance

**POST** `/surveillance/data`

Envoi de données de surveillance en temps réel.

```json
{
  "session_id": "sess_123456789",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "video": {
      "face_detected": true,
      "face_confidence": 0.95,
      "multiple_faces": false,
      "objects_detected": ["phone"],
      "gaze_direction": "screen"
    },
    "audio": {
      "voice_detected": false,
      "noise_level": 0.1,
      "suspicious_sounds": false
    },
    "screen": {
      "active_window": "vscode.exe",
      "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "clipboard_activity": false
    },
    "system": {
      "running_processes": ["vscode.exe", "java.exe"],
      "network_activity": true,
      "disk_usage": 0.65
    }
  }
}
```

### 5.3 Alertes

**GET** `/surveillance/alerts`

Récupération des alertes de surveillance.

**Paramètres :**
- `session_id` : ID de session spécifique
- `severity` : `low`, `medium`, `high`, `critical`
- `start_date` : Date de début
- `end_date` : Date de fin

**Réponse :**
```json
{
  "alerts": [
    {
      "id": "alert_001",
      "session_id": "sess_123456789",
      "type": "face_not_detected",
      "severity": "medium",
      "timestamp": "2025-01-15T10:30:00Z",
      "description": "Visage non détecté pendant 30 secondes",
      "details": {
        "duration": 30,
        "confidence_threshold": 0.8
      },
      "status": "active"
    }
  ]
}
```

## 6. Endpoints IA

### 6.1 Analyse IA

**POST** `/ai/analyze`

Analyse IA des données de surveillance.

```json
{
  "session_id": "sess_123456789",
  "data_type": "video",
  "data": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Réponse :**
```json
{
  "analysis_id": "analysis_001",
  "results": {
    "face_detection": {
      "detected": true,
      "confidence": 0.95,
      "face_count": 1,
      "face_locations": [[100, 150, 200, 250]]
    },
    "object_detection": {
      "objects": [
        {
          "name": "phone",
          "confidence": 0.87,
          "location": [300, 400, 350, 450]
        }
      ]
    },
    "gaze_analysis": {
      "looking_at_screen": true,
      "gaze_confidence": 0.92
    }
  },
  "alerts": [
    {
      "type": "object_detected",
      "severity": "medium",
      "description": "Téléphone détecté"
    }
  ]
}
```

### 6.2 Modèles IA

**GET** `/ai/models`

Récupération des modèles IA disponibles.

**Réponse :**
```json
{
  "models": [
    {
      "id": "face_detection_v1",
      "name": "Face Detection Model",
      "version": "1.0.0",
      "type": "computer_vision",
      "accuracy": 0.95,
      "last_updated": "2025-01-01T00:00:00Z"
    },
    {
      "id": "object_detection_v1",
      "name": "Object Detection Model",
      "version": "1.0.0",
      "type": "computer_vision",
      "accuracy": 0.89,
      "last_updated": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## 7. WebSocket Events

### 7.1 Connexion

**URL** : `wss://api.proctoflex.ai/ws`

**Authentification :**
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 7.2 Events

#### 7.2.1 Surveillance Update

```json
{
  "type": "surveillance_update",
  "session_id": "sess_123456789",
  "data": {
    "timestamp": "2025-01-15T10:30:00Z",
    "status": "active",
    "alerts": []
  }
}
```

#### 7.2.2 Alert

```json
{
  "type": "alert",
  "session_id": "sess_123456789",
  "alert": {
    "id": "alert_001",
    "type": "face_not_detected",
    "severity": "medium",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

#### 7.2.3 Exam Status

```json
{
  "type": "exam_status",
  "exam_id": 1,
  "status": "active",
  "participants": 25,
  "time_remaining": 7200
}
```

## 8. Codes d'Erreur

### 8.1 Codes HTTP

- `200` : Succès
- `201` : Créé
- `400` : Requête invalide
- `401` : Non autorisé
- `403` : Interdit
- `404` : Non trouvé
- `422` : Données invalides
- `429` : Trop de requêtes
- `500` : Erreur serveur

### 8.2 Codes d'Erreur Spécifiques

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email ou mot de passe incorrect",
    "details": {}
  }
}
```

**Codes d'erreur courants :**
- `AUTH_INVALID_CREDENTIALS` : Identifiants invalides
- `AUTH_TOKEN_EXPIRED` : Token expiré
- `EXAM_NOT_FOUND` : Examen non trouvé
- `EXAM_ALREADY_STARTED` : Examen déjà démarré
- `SESSION_INVALID` : Session invalide
- `SURVEILLANCE_ERROR` : Erreur de surveillance
- `AI_ANALYSIS_FAILED` : Échec de l'analyse IA

## 9. Exemples

### 9.1 Exemple Complet - Démarrage d'Examen

```bash
# 1. Authentification
curl -X POST https://api.proctoflex.ai/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "etudiant@esprim.tn",
    "password": "motdepasse123"
  }'

# 2. Récupération des examens
curl -X GET https://api.proctoflex.ai/v1/exams \
  -H "Authorization: Bearer <token>"

# 3. Démarrage d'un examen
curl -X POST https://api.proctoflex.ai/v1/exams/1/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "identity_verification": {
      "face_image": "data:image/jpeg;base64,...",
      "id_document": "data:image/jpeg;base64,..."
    },
    "system_info": {
      "os": "Windows 11",
      "webcam_available": true,
      "microphone_available": true
    }
  }'
```

### 9.2 Exemple WebSocket

```javascript
const ws = new WebSocket('wss://api.proctoflex.ai/ws');

ws.onopen = () => {
  // Authentification
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'surveillance_update':
      console.log('Mise à jour surveillance:', data);
      break;
    case 'alert':
      console.log('Alerte détectée:', data.alert);
      break;
  }
};
```

---

**Version** : 1.0.0  
**Dernière mise à jour** : Août 2025  
**Base URL** : https://api.proctoflex.ai/v1  
**Support** : api-support@proctoflex.ai
