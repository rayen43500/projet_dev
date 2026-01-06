/**
 * Service WebSocket pour les alertes en temps réel
 */

import { WS_BASE_URL, WS_ENDPOINT } from '../config/api';

export interface AlertMessage {
  type: string;
  alert?: {
    id: number;
    session_id: number;
    exam_id: number;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: string;
    is_resolved: boolean;
  };
  message?: string;
  user_id?: number;
  exam_id?: number;
  session_id?: number;
}

export type AlertCallback = (alert: AlertMessage) => void;
export type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private alertCallbacks: Set<AlertCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private isConnecting = false;

  constructor() {
    // Récupérer le token depuis localStorage
    this.token = localStorage.getItem('auth_token');
  }

  connect(token?: string): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    if (token) {
      this.token = token;
    }

    if (!this.token) {
      console.warn('WebSocket: Aucun token disponible');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = `${WS_BASE_URL}${WS_ENDPOINT}?token=${encodeURIComponent(this.token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connecté');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnection(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data: AlertMessage = JSON.parse(event.data);
          
          // Gérer les messages de connexion
          if (data.type === 'connected' || data.type === 'pong') {
            // Message de connexion réussie
            return;
          }

          // Notifier tous les callbacks d'alertes
          if (data.type === 'alert' && data.alert) {
            this.alertCallbacks.forEach(callback => {
              try {
                callback(data);
              } catch (error) {
                console.error('Erreur dans le callback d\'alerte:', error);
              }
            });
          }
        } catch (error) {
          console.error('Erreur lors du parsing du message WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket déconnecté');
        this.isConnecting = false;
        this.notifyConnection(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket: Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`WebSocket: Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  subscribeToExam(examId: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_exam',
        exam_id: examId
      }));
    }
  }

  subscribeToSession(sessionId: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_session',
        session_id: sessionId
      }));
    }
  }

  onAlert(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.alertCallbacks.delete(callback);
    };
  }

  onConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Erreur dans le callback de connexion:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }
}

// Instance singleton
export const wsService = new WebSocketService();

