import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Monitor,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  PlusCircle,
  CalendarDays,
  Brain
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CreateExamModal from '../../components/Exams/CreateExamModal';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

interface DashboardStats {
  planned_exams: number;
  active_sessions: number;
  critical_alerts: number;
  monitored_students: number;
}

interface ActiveSession {
  id: number;
  student: string;
  exam: string;
  status: string;
  duration: string;
  alerts: number;
  risk: string;
}

interface RecentAlert {
  id: number;
  type: string;
  student: string;
  exam: string;
  time: string;
  severity: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    planned_exams: 0,
    active_sessions: 0,
    critical_alerts: 0,
    monitored_students: 0,
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Charger les statistiques
      const statsResponse = await apiService.get(API_ENDPOINTS.SURVEILLANCE.DASHBOARD_STATS);
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Charger les sessions actives
      const sessionsResponse = await apiService.get(API_ENDPOINTS.SURVEILLANCE.ACTIVE_SESSIONS);
      if (sessionsResponse.data) {
        setActiveSessions(sessionsResponse.data);
      }

      // Charger les alertes récentes
      const alertsResponse = await apiService.get(API_ENDPOINTS.SURVEILLANCE.RECENT_ALERTS);
      if (alertsResponse.data) {
        setRecentAlerts(alertsResponse.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis = [
    {
      name: 'Examens planifiés',
      value: stats.planned_exams.toString(),
      sub: 'Cette semaine',
      icon: CalendarDays,
      color: 'from-blue-500/10 to-blue-500/5',
      pill: 'Planning',
    },
    {
      name: 'Sessions en cours',
      value: stats.active_sessions.toString(),
      sub: 'Surveillées en temps réel',
      icon: Monitor,
      color: 'from-emerald-500/10 to-emerald-500/5',
      pill: 'En direct',
    },
    {
      name: 'Alertes critiques',
      value: stats.critical_alerts.toString(),
      sub: 'À vérifier rapidement',
      icon: AlertTriangle,
      color: 'from-rose-500/10 to-rose-500/5',
      pill: 'Risque',
    },
    {
      name: "Étudiants surveillés",
      value: stats.monitored_students.toString(),
      sub: 'Sur les 30 derniers jours',
      icon: Users,
      color: 'from-violet-500/10 to-violet-500/5',
      pill: 'Historique',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <XCircle className="h-4 w-4 text-rose-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-100 text-rose-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-sky-100 text-sky-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête enseignant */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Bonjour, {user?.username ?? 'Enseignant'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Vue d&apos;ensemble de vos examens, sessions surveillées et alertes IA.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer un examen
          </button>
          <button className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            <PlayCircle className="mr-2 h-4 w-4 text-emerald-500" />
            Démarrer une session
          </button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.name}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 shadow-sm ring-1 ring-slate-100"
          >
            <div className={`absolute inset-0 bg-gradient-to-tr ${kpi.color} pointer-events-none`} />
            <div className="relative flex items-start justify-between p-4">
              <div>
                <div className="inline-flex items-center rounded-full bg-white/60 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-100 backdrop-blur">
                  {kpi.pill}
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {kpi.name}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{kpi.value}</p>
                <p className="mt-1 text-xs text-slate-600">{kpi.sub}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-slate-100">
                <kpi.icon className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sessions actives */}
        <div className="xl:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sessions en cours</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Surveillez en temps réel les comportements détectés par l&apos;IA.
              </p>
            </div>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Voir toutes les sessions
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Étudiant
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Examen
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Statut
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Durée
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Alertes
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Risque IA
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                      Aucune session active pour le moment
                    </td>
                  </tr>
                ) : (
                  activeSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-900">
                      {session.student}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-700">
                      {session.exam}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {getStatusIcon(session.status)}
                        <span className="ml-1.5">
                          {session.status === 'active' ? 'En cours' : 'Terminé'}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-700">
                      {session.duration}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-700">
                      {session.alerts > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                          {session.alerts} alerte(s)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Aucune
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-700">
                      {session.risk}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs">
                      <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        Ouvrir la session
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panneau IA & alertes */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900 text-slate-50 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  IA de surveillance
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Détection en temps réel activée
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80">
                <Brain className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-300">
              Analyse vidéo, audio et écran pour repérer les comportements suspects pendant vos
              examens.
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Alertes récentes</h2>
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                IA & règles métier
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {recentAlerts.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  Aucune alerte récente
                </div>
              ) : (
                recentAlerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{alert.type}</p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {alert.student} · {alert.exam}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getSeverityClass(alert.severity)}`}>
                      {alert.severity === 'high'
                        ? 'Critique'
                        : alert.severity === 'medium'
                          ? 'Moyenne'
                          : 'Faible'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{alert.time}</p>
                </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-600">
            Astuce: configurez vos examens dans l&apos;onglet &laquo; Examens &raquo; puis lancez
            les sessions depuis ce tableau de bord pour profiter du suivi IA complet.
          </div>
        </div>
      </div>

      {/* Modal de création d'examen */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Rafraîchir les données du dashboard
          loadDashboardData();
        }}
      />
    </div>
  );
};

export default Dashboard;
