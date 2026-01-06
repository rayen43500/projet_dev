import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Identity from './pages/Identity.tsx';
import Surveillance from './pages/Surveillance.tsx';
import Register from './pages/Register.tsx';
import Exams from './pages/Exams.tsx';
import AppLayout from './components/Layout/AppLayout.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LoadingSpinner from './components/ui/LoadingSpinner.tsx';

function ProtectedRoute({ children }: { children: JSX.Element }): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Vérification de l'authentification..." />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppContent(): JSX.Element {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/exams" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/exams" element={
          <ProtectedRoute>
            <AppLayout 
              currentPage="exams"
              onNavigate={() => {
                // Navigation sera gérée par React Router
              }}
              onLogout={logout}
            >
              <Exams />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/identity" element={
          <ProtectedRoute>
            <AppLayout 
              currentPage="identity"
              onNavigate={() => {
                // Navigation sera gérée par React Router
              }}
              onLogout={logout}
            >
              <Identity />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/surveillance" element={
          <ProtectedRoute>
            <AppLayout 
              currentPage="surveillance"
              onNavigate={() => {
                // Navigation sera gérée par React Router
              }}
              onLogout={logout}
            >
              <Surveillance />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout 
              currentPage="settings"
              onNavigate={() => {
                // Navigation sera gérée par React Router
              }}
              onLogout={logout}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Paramètres</h2>
                <p className="text-gray-600">Page de paramètres en cours de développement...</p>
              </div>
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


