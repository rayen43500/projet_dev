// API service for the Electron desktop app
const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  instructions?: string;
  exam_status: 'assigned' | 'started' | 'completed' | 'failed';
  assigned_at: string;
  pdf_filename?: string;
}

type LoginResponse = {
  access_token: string;
  token_type: string;
  user_id?: number;
  username?: string;
  email?: string;
  role?: string;
};

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('pf_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    // Le backend utilise OAuth2PasswordRequestForm qui attend application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', email); // Le backend accepte email dans le champ username
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Login failed: ${response.status}`);
    }

    return response.json();
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    username?: string;
    full_name?: string;
    face_image_base64?: string;
  }): Promise<{ access_token: string; token_type: string }> {
    // Utiliser l'endpoint /auth/register standard
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username || userData.email.split('@')[0],
        full_name: userData.full_name || userData.name,
        email: userData.email,
        password: userData.password
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Registration failed: ${response.status}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token invalide ou expiré
          localStorage.removeItem('pf_token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        if (response.status === 404) {
          // Endpoint /auth/me n'existe pas, utiliser fallback
          return this.getUserFromToken();
        }
        throw new Error(`Failed to get user: ${response.status}`);
      }

      const userData = await response.json();
      // Adapter la réponse du backend au format User
      return {
        id: userData.id,
        name: userData.full_name || userData.username || 'Utilisateur',
        email: userData.email,
        role: userData.role || 'student',
        is_active: userData.is_active !== false
      };
    } catch (error) {
      // Si erreur réseau ou autre, essayer de récupérer depuis le token
      const token = localStorage.getItem('pf_token');
      if (token) {
        try {
          return this.getUserFromToken();
        } catch {
          throw error;
        }
      }
      throw error;
    }
  }

  private getUserFromToken(): User {
    const token = localStorage.getItem('pf_token');
    if (!token) {
      throw new Error('No token available');
    }

    // Si token JWT, décoder le payload
    if (token.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          id: payload.sub ? parseInt(payload.sub) || 1 : 1,
          name: payload.name || payload.username || 'Étudiant',
          email: payload.email || 'student@test.com',
          role: payload.role || 'student',
          is_active: payload.is_active !== false
        };
      } catch (_e) {
        // Token invalide, retourner un utilisateur par défaut
      }
    }

    // Fallback par défaut
    return {
      id: 1,
      name: 'Étudiant',
      email: 'student@test.com',
      role: 'student',
      is_active: true
    };
  }

  async getStudentExams(studentId: number): Promise<Exam[]> {
    const response = await fetch(`${API_BASE_URL}/exams/student/${studentId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré, nettoyer le localStorage
        localStorage.removeItem('auth_token');
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      throw new Error(`Failed to get exams: ${response.status}`);
    }

    return response.json();
  }

  async getExam(examId: string): Promise<Exam> {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get exam: ${response.status}`);
    }

    return response.json();
  }

  async startExam(examId: string, studentId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ student_id: studentId })
    });

    if (!response.ok) {
      throw new Error(`Failed to start exam: ${response.status}`);
    }
  }

  async submitExam(examId: string, studentId: number, answers: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ 
        student_id: studentId,
        answers: answers
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit exam: ${response.status}`);
    }
  }

  async getExamPDF(examId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/view`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get exam PDF: ${response.status}`);
    }

    return response.blob();
  }
}

export const apiService = new ApiService();