import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Récupère les informations de l'utilisateur connecté
   */
  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Note: L'endpoint /me n'existe pas encore dans le backend
      // Pour l'instant, on utilise les infos du token
      // TODO: Implémenter l'endpoint /me dans le backend
      const response = await apiService.get(API_ENDPOINTS.AUTH.ME);
      if (response.data) {
        setUser(response.data);
      } else {
        // Si l'endpoint n'existe pas, on décode le token (temporaire)
        // En production, il faudra implémenter l'endpoint /me
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const token = localStorage.getItem('auth_token');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Utiliser OAuth2PasswordRequestForm format (le champ 'username' accepte maintenant email ou username)
      const formData = new URLSearchParams();
      formData.append('username', email); // Le backend accepte email dans le champ username
      formData.append('password', password);

      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        formData.toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      );

      if (response.data && response.data.access_token) {
        // Sauvegarder le token
        localStorage.setItem('auth_token', response.data.access_token);
        
        // Sauvegarder les infos utilisateur si disponibles
        if (response.data.user_id || response.data.username) {
          const userData: User = {
            id: response.data.user_id || 0,
            username: response.data.username || '',
            email: response.data.email || email,
            role: response.data.role || 'student',
          };
          setUser(userData);
        } else {
          // Si pas d'infos utilisateur, on les récupère
          await refreshUser();
        }
        
        return true;
      } else {
        console.error('Réponse de login invalide:', response);
        return false;
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    // Optionnel: appeler l'endpoint de déconnexion du backend
    // apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
