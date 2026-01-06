import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { 
  BookOpen, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  Eye,
  Minus,
  Maximize2,
  X
} from 'lucide-react';
import Button from '../ui/Button';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

export default function AppLayout({ 
  children, 
  onNavigate,
  onLogout 
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications] = useState();
  const [searchQuery, setSearchQuery] = useState('');

  // Fonctions de contrôle de fenêtre
  const handleCloseWindow = () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  const handleMinimizeWindow = () => {
    if (window.electronAPI && window.electronAPI.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximizeWindow = () => {
    if (window.electronAPI && window.electronAPI.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    }
  };

  // Bouton masquer retiré pour éviter la confusion avec Minimiser

  // Activer les raccourcis clavier
  useKeyboardShortcuts();

  // Écouter les événements du menu principal
  useEffect(() => {
    const handleNavigate = (_event: any, page: string) => {
      onNavigate?.(page);
    };

    const handleShowAbout = () => {
      alert('ProctoFlex AI v1.0.0\nApplication d\'examen sécurisé pour étudiants');
    };

    // Écouter les événements IPC du processus principal
    if (window.electronAPI && window.electronAPI.onNavigate) {
      window.electronAPI.onNavigate(handleNavigate);
    }
    if (window.electronAPI && window.electronAPI.onShowAbout) {
      window.electronAPI.onShowAbout(handleShowAbout);
    }

    return () => {
      // Nettoyage des écouteurs
    };
  }, [onNavigate]);

  const navigation = [
    { 
      id: 'exams', 
      name: 'Mes Examens', 
      icon: BookOpen, 
      current: location.pathname === '/exams',
      badge: 2,
      description: 'Consultez vos examens assignés',
      path: '/exams'
    },
    { 
      id: 'identity', 
      name: 'Mon Profil', 
      icon: User, 
      current: location.pathname === '/identity',
      description: 'Gérez votre profil utilisateur',
      path: '/identity'
    },
    { 
      id: 'surveillance', 
      name: 'Surveillance', 
      icon: Eye, 
      current: location.pathname === '/surveillance',
      description: 'Système de surveillance d\'examen',
      path: '/surveillance'
    },
    { 
      id: 'settings', 
      name: 'Paramètres', 
      icon: Settings, 
      current: location.pathname === '/settings',
      description: 'Configuration de l\'application',
      path: '/settings'
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* En-tête unifié */}
      <div className="fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between gap-3 py-2" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            {/* Logo + Titre */}
            <div className="flex items-center gap-3 min-w-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm sm:text-base font-medium text-gray-800 truncate">
                <span className="hidden sm:inline">ProctoFlex AI</span>
              </span>
            </div>

            {/* Navigation + Recherche */}
            <div className="flex items-center gap-6 sm:gap-6 flex-1 min-w-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              {/* Navigation icônes */}
              <div className="flex items-center justify-start gap-4 overflow-x-auto flex-nowrap whitespace-nowrap px-2 ml-2 pl-3 border-l border-gray-200/70 electron-scrollbar">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      title={item.name}
                      aria-label={item.name}
                      type="button"
                      role="tab"
                      aria-selected={item.current}
                      tabIndex={item.current ? 0 : -1}
                      className={`relative shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 hover:scale-105 whitespace-nowrap ${
                        item.current
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white/90 text-gray-700 hover:bg-blue-50 border border-gray-200/70 hover:border-blue-300 hover:shadow'
                      }`}
                      style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto', cursor: 'pointer' } as React.CSSProperties}
                      data-tab-id={item.id}
                    >
                      <Icon className={`w-5 h-5 ${item.current ? 'text-white' : 'text-gray-600'}`} />
                      <span className="electron-sr-only">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className={`absolute -top-1 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] rounded-full font-bold flex items-center justify-center ring-2 ring-white ${
                          item.current ? 'bg-white/90 text-blue-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Barre de recherche */}
              <div className="relative hidden md:flex flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-white/80 shadow-sm hover:shadow-md transition-all duration-300"
                />
              </div>
            </div>
            {/* Utilisateur + Notifications + Fenêtre */}
            <div className="flex items-center gap-2 sm:gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              {/* Notifications */}
              <button 
                className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 rounded-lg hover:bg-gray-100"
                title={`${notifications} notifications`}
              >
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </button>

              {/* User */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-white/90 to-blue-50/90 rounded-xl border border-gray-200/60 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-gray-900 leading-none">Étudiant</p>
                  <p className="text-xs text-gray-600">desktop_user@example.com</p>
                </div>
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="sm"
                  icon={LogOut}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg p-2"
                >
                  <span className="hidden lg:inline">Déconnexion</span>
                </Button>
              </div>

              {/* Window controls */}
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={handleMinimizeWindow}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Réduire la fenêtre"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleMaximizeWindow}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Agrandir/Restaurer la fenêtre"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCloseWindow}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Fermer l'application"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec offset ajusté */}
      <div className="electron-content">

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
}
