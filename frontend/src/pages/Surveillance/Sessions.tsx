import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  RefreshCw,
  Eye,
  TrendingUp
} from 'lucide-react';
import { apiService } from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { wsService, AlertMessage } from '../../services/websocket';

interface Session {
  id: number;
  student: string;
  student_id: number;
  exam: string;
  exam_id: number;
  status: string;
  duration: string;
  alerts: number;
  risk: string;
  start_time: string;
}

interface SessionStats {
  active_sessions: number;
  completed_sessions: number;
  total_alerts: number;
  average_duration: string;
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    active_sessions: 0,
    completed_sessions: 0,
    total_alerts: 0,
    average_duration: '0h 0m'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les sessions actives
      const sessionsResponse = await apiService.get<Session[]>(
        API_ENDPOINTS.SURVEILLANCE.ACTIVE_SESSIONS
      );

      if (sessionsResponse.error) {
        setError(sessionsResponse.error);
        return;
      }

      if (sessionsResponse.data) {
        // Mapper les sessions pour déterminer le statut "attention"
        const mappedSessions = sessionsResponse.data.map(session => {
          // Si le risque est élevé ou s'il y a des alertes, marquer comme "attention"
          if ((session.risk && (session.risk.toLowerCase() === 'moyen' || session.risk.toLowerCase() === 'élevé')) || 
              (session.alerts && session.alerts > 0)) {
            return { ...session, status: 'attention' };
          }
          return session;
        });
        
        setSessions(mappedSessions);
        
        // Calculer les statistiques
        const active = mappedSessions.filter(s => s.status === 'active' || s.status === 'en cours').length;
        const completed = mappedSessions.filter(s => s.status === 'completed' || s.status === 'terminé').length;
        const totalAlerts = mappedSessions.reduce((sum, s) => sum + (s.alerts || 0), 0);
        
        // Calculer la durée moyenne
        const avgDuration = calculateAverageDuration(mappedSessions);
        
        setStats({
          active_sessions: active,
          completed_sessions: completed,
          total_alerts: totalAlerts,
          average_duration: avgDuration
        });
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erreur lors du chargement des sessions:', err);
      setError('Erreur lors du chargement des sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverageDuration = (sessions: Session[]): string => {
    if (sessions.length === 0) return '0h 0m';
    
    const durations = sessions.map(s => {
      // Parser "1h 23m" ou "45m"
      const match = s.duration.match(/(?:(\d+)h\s*)?(?:(\d+)m)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      return hours * 60 + minutes;
    });

    const avgMinutes = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.floor(avgMinutes % 60);
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatTime = (timestamp: string): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (timestamp: string): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins === 1) return 'Il y a 1 min';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    if (hours === 1) return 'Il y a 1h';
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Il y a 1 jour';
    return `Il y a ${days} jour(s)`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'en cours':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
      case 'terminé':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'attention':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'terminated':
      case 'terminé':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'attention':
      case 'warning':
        return 'Attention';
      default:
        return status;
    }
  };

  useEffect(() => {
    loadSessions();

    // Configurer WebSocket pour les mises à jour en temps réel
    const token = localStorage.getItem('auth_token');
    if (token) {
      wsService.connect(token);

      const unsubscribeConnection = wsService.onConnection((connected) => {
        setIsConnected(connected);
      });

      const unsubscribeAlert = wsService.onAlert((alertMessage: AlertMessage) => {
        // Rafraîchir les sessions lorsqu'une alerte est reçue
        loadSessions();
      });

      return () => {
        unsubscribeConnection();
        unsubscribeAlert();
      };
    }

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      loadSessions();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions de Surveillance</h1>
          <p className="text-gray-600 mt-1">
            Suivi en temps réel des sessions d'examen
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          <button
            onClick={loadSessions}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sessions Actives</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_sessions}</p>
            </div>
            <Monitor className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed_sessions}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_alerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Temps Moyen</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.average_duration}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tableau des sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Sessions en Cours</h2>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Chargement des sessions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aucune session active pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Examen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Début
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alertes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière Activité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.student}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.exam}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {getStatusText(session.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(session.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.alerts > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {session.alerts}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Aucune</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeAgo(session.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;

