import React, { useState, useEffect } from 'react';
import { AlertCircle, X, CheckCircle, Clock } from 'lucide-react';
import { wsService, AlertMessage } from '../../services/websocket';
import { apiService } from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

interface Alert {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  student?: string;
  exam?: string;
  session_id?: number;
  exam_id?: number;
  is_resolved?: boolean;
}

interface AlertsPanelProps {
  sessionId?: number;
  examId?: number;
  limit?: number;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ sessionId, examId, limit = 50 }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les alertes récentes
    loadRecentAlerts();

    // Configurer WebSocket
    const token = localStorage.getItem('auth_token');
    if (token) {
      wsService.connect(token);

      // S'abonner aux alertes en temps réel
      const unsubscribe = wsService.onAlert((alertMessage: AlertMessage) => {
        if (alertMessage.alert) {
          const newAlert: Alert = {
            id: alertMessage.alert.id,
            type: alertMessage.alert.alert_type,
            severity: alertMessage.alert.severity,
            description: alertMessage.alert.description,
            timestamp: alertMessage.alert.timestamp || new Date().toISOString(),
            session_id: alertMessage.alert.session_id,
            exam_id: alertMessage.alert.exam_id,
            is_resolved: alertMessage.alert.is_resolved,
          };
          
          setAlerts(prev => [newAlert, ...prev].slice(0, limit));
        }
      });

      // Surveiller la connexion
      const unsubscribeConnection = wsService.onConnection((connected) => {
        setIsConnected(connected);
        if (connected) {
          // S'abonner aux examens/sessions si spécifiés
          if (examId) {
            wsService.subscribeToExam(examId);
          }
          if (sessionId) {
            wsService.subscribeToSession(sessionId);
          }
        }
      });

      return () => {
        unsubscribe();
        unsubscribeConnection();
      };
    }

    return () => {
      // Ne pas déconnecter globalement, juste nettoyer les callbacks
    };
  }, [sessionId, examId, limit]);

  const loadRecentAlerts = async () => {
    setLoading(true);
    try {
      const response = await apiService.get<Alert[]>(API_ENDPOINTS.SURVEILLANCE.RECENT_ALERTS);
      if (response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Date inconnue';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days} jour(s)`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Alertes en temps réel</h3>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-center text-gray-500">Chargement des alertes...</div>
      ) : alerts.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-gray-500">Aucune alerte pour le moment</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 ${getSeverityColor(alert.severity)} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`mt-0.5 ${getSeverityColor(alert.severity).split(' ')[1]}`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                    {alert.student && (
                      <p className="text-xs text-gray-500 mt-1">
                        Étudiant: {alert.student} {alert.exam && `• Examen: ${alert.exam}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;

