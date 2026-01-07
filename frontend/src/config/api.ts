/**
 * Configuration de l'API Backend
 */

// URL de base de l'API - utilise les variables d'environnement ou la valeur par défaut
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
export const WS_ENDPOINT = '/ws';

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },
  // Utilisateurs
  USERS: {
    LIST: '/api/v1/users',
    STUDENTS: '/api/v1/users/students',
    GET: (id: number) => `/api/v1/users/${id}`,
    CREATE: '/api/v1/users',
    UPDATE: (id: number) => `/api/v1/users/${id}`,
    DELETE: (id: number) => `/api/v1/users/${id}`,
  },
  // Examens
  EXAMS: {
    LIST: '/api/v1/exams',
    GET: (id: number) => `/api/v1/exams/${id}`,
    CREATE: '/api/v1/exams',
    UPDATE: (id: number) => `/api/v1/exams/${id}`,
    DELETE: (id: number) => `/api/v1/exams/${id}`,
    ASSIGN_STUDENTS: (id: number) => `/api/v1/exams/${id}/assign-students`,
    GET_STUDENTS: (id: number) => `/api/v1/exams/${id}/students`,
    REMOVE_STUDENT: (examId: number, studentId: number) => `/api/v1/exams/${examId}/students/${studentId}`,
    GET_STUDENT_EXAMS: (studentId: number) => `/api/v1/exams/student/${studentId}`,
  },
  // Sessions
  SESSIONS: {
    LIST: '/api/v1/sessions',
    GET: (id: number) => `/api/v1/sessions/${id}`,
    CREATE: '/api/v1/sessions',
    UPDATE: (id: number) => `/api/v1/sessions/${id}`,
    DELETE: (id: number) => `/api/v1/sessions/${id}`,
  },
  // Surveillance
  SURVEILLANCE: {
    VERIFY_IDENTITY: '/api/v1/surveillance/verify-identity',
    START_SESSION: '/api/v1/surveillance/start-session',
    SESSION_STATUS: (id: number) => `/api/v1/surveillance/session/${id}/status`,
    ACTIVE_SESSIONS: '/api/v1/surveillance/sessions/active',
    RECENT_ALERTS: '/api/v1/surveillance/alerts/recent',
    DASHBOARD_STATS: '/api/v1/surveillance/dashboard/stats',
  },
  // Health
  HEALTH: '/api/v1/health',
} as const;

// Configuration des requêtes
export const API_CONFIG = {
  timeout: 30000, // 30 secondes
  retries: 3,
  retryDelay: 1000, // 1 seconde
} as const;

