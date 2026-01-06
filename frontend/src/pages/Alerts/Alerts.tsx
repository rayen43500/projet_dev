import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AlertsPanel from '../../components/Alerts/AlertsPanel';
import { apiService } from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

interface Alert {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  exam?: string;
  is_resolved?: boolean;
}

const Alerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get<Alert[]>(API_ENDPOINTS.SURVEILLANCE.RECENT_ALERTS);
      if (response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.severity === filter
  );

  const getSeverityStats = () => {
    return {
      all: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
    };
  };

  const stats = getSeverityStats();

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

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Date inconnue';
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Alertes</h1>
          <p className="text-gray-600 mt-1">
            Suivez vos alertes de surveillance en temps réel
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div
          onClick={() => setFilter('all')}
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
            filter === 'all' ? 'border-blue-500' : 'border-transparent'
          }`}
        >
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.all}</div>
        </div>
        <div
          onClick={() => setFilter('critical')}
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
            filter === 'critical' ? 'border-red-500' : 'border-transparent'
          }`}
        >
          <div className="text-sm text-gray-600">Critiques</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</div>
        </div>
        <div
          onClick={() => setFilter('high')}
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
            filter === 'high' ? 'border-orange-500' : 'border-transparent'
          }`}
        >
          <div className="text-sm text-gray-600">Élevées</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.high}</div>
        </div>
        <div
          onClick={() => setFilter('medium')}
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
            filter === 'medium' ? 'border-yellow-500' : 'border-transparent'
          }`}
        >
          <div className="text-sm text-gray-600">Moyennes</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.medium}</div>
        </div>
        <div
          onClick={() => setFilter('low')}
          className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
            filter === 'low' ? 'border-blue-500' : 'border-transparent'
          }`}
        >
          <div className="text-sm text-gray-600">Faibles</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.low}</div>
        </div>
      </div>

      {/* Alerts Panel en temps réel */}
      <AlertsPanel limit={50} />

      {/* Liste détaillée des alertes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historique des alertes</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500">Aucune alerte trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${getSeverityColor(alert.severity)} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                    {alert.exam && (
                      <p className="text-xs text-gray-500 mt-1">Examen: {alert.exam}</p>
                    )}
                  </div>
                  {alert.is_resolved && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;

