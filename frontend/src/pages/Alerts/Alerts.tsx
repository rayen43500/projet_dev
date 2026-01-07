import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Filter, Printer } from 'lucide-react';
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

  const formatTimeForReport = (timestamp: string) => {
    if (!timestamp) return 'Date inconnue';
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Critique';
      case 'high':
        return 'Élevée';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Faible';
      default:
        return severity;
    }
  };

  const printReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert('Veuillez autoriser les popups pour imprimer le rapport');
      return;
    }

    const reportDate = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const filteredStats = {
      all: filteredAlerts.length,
      critical: filteredAlerts.filter(a => a.severity === 'critical').length,
      high: filteredAlerts.filter(a => a.severity === 'high').length,
      medium: filteredAlerts.filter(a => a.severity === 'medium').length,
      low: filteredAlerts.filter(a => a.severity === 'low').length,
    };

    const reportHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'Alertes - ProctoFlex</title>
  <style>
    @media print {
      @page {
        margin: 1.5cm;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      background: white;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #1e40af;
      font-size: 28px;
    }
    .header-info {
      margin-top: 10px;
      color: #666;
      font-size: 14px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
    }
    .stat-critical { border-left: 4px solid #dc2626; }
    .stat-high { border-left: 4px solid #ea580c; }
    .stat-medium { border-left: 4px solid #ca8a04; }
    .stat-low { border-left: 4px solid #2563eb; }
    .stat-all { border-left: 4px solid #475569; }
    .alerts-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .alerts-table th {
      background: #1e40af;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    .alerts-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .alerts-table tr:hover {
      background: #f8fafc;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .severity-critical {
      background: #fee2e2;
      color: #991b1b;
    }
    .severity-high {
      background: #fed7aa;
      color: #9a3412;
    }
    .severity-medium {
      background: #fef3c7;
      color: #854d0e;
    }
    .severity-low {
      background: #dbeafe;
      color: #1e40af;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .no-alerts {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Rapport d'Alertes de Surveillance</h1>
    <div class="header-info">
      <strong>Généré le:</strong> ${reportDate}<br>
      <strong>Filtre appliqué:</strong> ${filter === 'all' ? 'Toutes les alertes' : getSeverityLabel(filter)}<br>
      <strong>Total d'alertes:</strong> ${filteredAlerts.length}
    </div>
  </div>

  <div class="stats">
    <div class="stat-card stat-all">
      <div class="stat-label">Total</div>
      <div class="stat-value">${filteredStats.all}</div>
    </div>
    <div class="stat-card stat-critical">
      <div class="stat-label">Critiques</div>
      <div class="stat-value">${filteredStats.critical}</div>
    </div>
    <div class="stat-card stat-high">
      <div class="stat-label">Élevées</div>
      <div class="stat-value">${filteredStats.high}</div>
    </div>
    <div class="stat-card stat-medium">
      <div class="stat-label">Moyennes</div>
      <div class="stat-value">${filteredStats.medium}</div>
    </div>
    <div class="stat-card stat-low">
      <div class="stat-label">Faibles</div>
      <div class="stat-value">${filteredStats.low}</div>
    </div>
  </div>

  ${filteredAlerts.length === 0 ? `
    <div class="no-alerts">
      <p>Aucune alerte à afficher pour le filtre sélectionné.</p>
    </div>
  ` : `
    <table class="alerts-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Sévérité</th>
          <th>Description</th>
          <th>Date/Heure</th>
          <th>Examen</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${filteredAlerts.map((alert, index) => `
          <tr>
            <td>#${alert.id}</td>
            <td>${alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
            <td>
              <span class="severity-badge severity-${alert.severity}">
                ${getSeverityLabel(alert.severity)}
              </span>
            </td>
            <td>${alert.description || 'Aucune description'}</td>
            <td>${formatTimeForReport(alert.timestamp)}</td>
            <td>${alert.exam || 'N/A'}</td>
            <td>${alert.is_resolved ? '✅ Résolue' : '⏳ En cours'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  <div class="footer">
    <p>Rapport généré par ProctoFlex AI - Système de surveillance d'examens</p>
    <p>Page 1 sur 1</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
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
        <div className="flex items-center space-x-3">
          <button
            onClick={printReport}
            disabled={filteredAlerts.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Imprimer le rapport des alertes"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer le rapport
          </button>
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

