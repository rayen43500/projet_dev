import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User } from '../../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    full_name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  // Sync identity to Electron main when user changes
  useEffect(() => {
    try {
      if (user && (window as any).electronAPI?.setStudentIdentity) {
        (window as any).electronAPI.setStudentIdentity({
          id: user.id,
          email: (user as any).email || user.name || 'unknown@example.com',
          name: user.name || (user as any).full_name || 'Utilisateur',
          role: (user as any).role || 'student',
          is_active: (user as any).is_active ?? true
        });
      } else if (!user && (window as any).electronAPI?.setStudentIdentity) {
        (window as any).electronAPI.setStudentIdentity(null);
      }
    } catch (e) {
      // ignore sync errors
    }
  }, [user]);

  const getAuthToken = (): string | null => {
    // Support des deux noms de token pour compatibilité
    return localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
  };

  const checkAuth = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (error: any) {
        console.error('Erreur de vérification auth:', error);
        // Si erreur 401, le token est invalide, le supprimer
        if (error.message?.includes('Session expirée') || error.message?.includes('401')) {
          localStorage.removeItem('pf_token');
          localStorage.removeItem('auth_token');
          setUser(null);
        } else {
          // Autre erreur, utiliser un fallback temporaire
          const fallbackUser = await apiService.getCurrentUser().catch(() => null);
          if (fallbackUser) {
            setUser(fallbackUser);
          } else {
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      // Stocker dans les deux pour compatibilité
      localStorage.setItem('pf_token', response.access_token);
      localStorage.setItem('auth_token', response.access_token);

      // Le backend renvoie user_id, username, email, role dans la réponse login
      if (response.user_id || response.username || response.email) {
        setUser({
          id: response.user_id ?? 1,
          name: response.username || 'Utilisateur',
          email: response.email || email,
          role: response.role || 'student',
          is_active: true,
        });
        // Essayer de récupérer les infos complètes depuis /auth/me
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (_profileError) {
          // Si /auth/me échoue, on garde les infos du login
          console.warn('Impossible de récupérer le profil complet, utilisation des données du login');
        }
        return;
      }

      // Sinon, tenter de récupérer /auth/me
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (_profileError) {
        // Fallback avec les infos disponibles
        setUser({
          id: 1,
          name: 'Utilisateur',
          email: email,
          role: 'student',
          is_active: true
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    full_name: string;
    email: string;
    password: string;
    face_image_base64?: string;
  }) => {
    try {
      const response = await apiService.register({
        name: userData.full_name || userData.username,
        email: userData.email,
        password: userData.password,
        username: userData.username,
        full_name: userData.full_name,
        face_image_base64: userData.face_image_base64
      });
      // Stocker dans les deux pour compatibilité
      localStorage.setItem('pf_token', response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      
      // Récupérer les données utilisateur
      const userInfo = await apiService.getCurrentUser();
      setUser(userInfo);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('pf_token');
    localStorage.removeItem('auth_token');
    setUser(null);
    try {
      if ((window as any).electronAPI?.setStudentIdentity) {
        (window as any).electronAPI.setStudentIdentity(null);
      }
    } catch {}
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Erreur de refresh user:', error);
      logout();
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
