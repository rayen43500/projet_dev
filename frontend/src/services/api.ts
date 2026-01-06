/**
 * Service API centralisé pour communiquer avec le backend
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG } from '../config/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Récupère le token d'authentification depuis le localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Construit les headers avec l'authentification
   */
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const token = this.getAuthToken();
    
    // Créer les headers en commençant par les defaults
    const headers: HeadersInit = new Headers(this.defaultHeaders);
    
    // Si customHeaders contient un Content-Type, il doit écraser le default
    if (customHeaders) {
      const customHeadersObj = new Headers(customHeaders);
      customHeadersObj.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Construit l'URL complète
   */
  private buildUrl(endpoint: string): string {
    // Si l'endpoint commence déjà par http, on le retourne tel quel
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Gère les erreurs de réponse
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Ignorer si le JSON est invalide
        }
      }

      // Gérer les erreurs d'authentification
      if (response.status === 401) {
        // Supprimer le token invalide
        localStorage.removeItem('auth_token');
        // Optionnel : rediriger vers la page de login si on est dans un contexte React Router
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          // Ne pas rediriger automatiquement pour éviter les boucles
          // La redirection sera gérée par AuthContext
        }
      }

      return {
        error: errorMessage,
        status: response.status,
      };
    }

    if (isJson) {
      try {
        const data = await response.json();
        return {
          data: data as T,
          status: response.status,
        };
      } catch {
        return {
          error: 'Erreur lors du parsing de la réponse JSON',
          status: response.status,
        };
      }
    }

    return {
      status: response.status,
    };
  }

  /**
   * Effectue une requête GET
   */
  async get<T = any>(endpoint: string, customHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        method: 'GET',
        headers: this.getHeaders(customHeaders),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue',
        status: 0,
      };
    }
  }

  /**
   * Effectue une requête POST
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    customHeaders?: HeadersInit
  ): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders(customHeaders);
      const headersObj = new Headers(headers);
      const contentType = headersObj.get('Content-Type');
      
      // Si c'est du form-urlencoded, ne pas faire JSON.stringify
      let body: string | undefined;
      if (data) {
        if (contentType === 'application/x-www-form-urlencoded') {
          // Si c'est déjà une string (URLSearchParams.toString()), l'utiliser directement
          body = typeof data === 'string' ? data : JSON.stringify(data);
        } else {
          // Sinon, utiliser JSON
          body = JSON.stringify(data);
        }
      }

      const response = await fetch(this.buildUrl(endpoint), {
        method: 'POST',
        headers,
        body,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue',
        status: 0,
      };
    }
  }

  /**
   * Effectue une requête PUT
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    customHeaders?: HeadersInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        method: 'PUT',
        headers: this.getHeaders(customHeaders),
        body: data ? JSON.stringify(data) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue',
        status: 0,
      };
    }
  }

  /**
   * Effectue une requête DELETE
   */
  async delete<T = any>(endpoint: string, customHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        method: 'DELETE',
        headers: this.getHeaders(customHeaders),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue',
        status: 0,
      };
    }
  }

  /**
   * Upload un fichier
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }

      const token = this.getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(this.buildUrl(endpoint), {
        method: 'POST',
        headers,
        body: formData,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue',
        status: 0,
      };
    }
  }
}

// Instance singleton
export const apiService = new ApiService();

