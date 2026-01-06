import { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Filter, Download, Play, CheckCircle, AlertCircle } from 'lucide-react';
import ExamViewer from './ExamViewer';
import { useNavigate } from 'react-router-dom';
import ModernExamCard from '../components/ModernExamCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Exam } from '../../services/api';

export default function Exams(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [showExamViewer, setShowExamViewer] = useState(false);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'started' | 'completed'>('all');

  // Récupérer l'ID de l'étudiant depuis le contexte d'authentification
  const studentId = user?.id || 6; // Fallback si pas d'utilisateur connecté

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.getStudentExams(studentId);
      setExams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  function getStatusColor(status: string) {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'assigned':
        return 'Assigné';
      case 'started':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'failed':
        return 'Échoué';
      default:
        return 'Inconnu';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'assigned':
        return <AlertCircle className="h-4 w-4" />;
      case 'started':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  function closeExamDetails() {
    setSelectedExam(null);
    setShowExamDetails(false);
  }

  function closeExamViewer() {
    setSelectedExam(null);
    setShowExamViewer(false);
  }

  function handleExamComplete() {
    // Recharger la liste des examens après completion
    loadExams();
    closeExamViewer();
  }

  function handleStartExam(exam: Exam) {
    setSelectedExam(exam);
    setShowExamViewer(true);
    // Auto-start surveillance: navigate to surveillance and start camera
    try {
      // stocker un flag pour demander démarrage auto
      sessionStorage.setItem('pf_autostart_surv', '1');
    } catch {}
    navigate('/surveillance');
  }

  function handleContinueExam(exam: Exam) {
    setSelectedExam(exam);
    setShowExamViewer(true);
  }

  function handleViewExam(exam: Exam) {
    setSelectedExam(exam);
    setShowExamViewer(true);
  }

  function handleDetailsExam(exam: Exam) {
    setSelectedExam(exam);
    setShowExamDetails(true);
  }


  const filteredExams = exams.filter(exam => {
    if (filter === 'all') return true;
    return exam.exam_status === filter;
  });

  const examStats = {
    total: exams.length,
    assigned: exams.filter(e => e.exam_status === 'assigned').length,
    started: exams.filter(e => e.exam_status === 'started').length,
    completed: exams.filter(e => e.exam_status === 'completed').length
  };

  async function downloadPDF(examId: string) {
    try {
      const token = localStorage.getItem('pf_token');
      const response = await fetch(`http://localhost:8000/api/v1/exams/${examId}/material`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `examen-${examId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Erreur lors du téléchargement du PDF');
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
        {/* Header avec bouton Actualiser */}
        <div className="bg-white/95 rounded-3xl shadow-xl border border-gray-200/60 p-8 sm:p-10 animate-fade-in-up hover-lift">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="sr-only">Mes Examens</h2>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={loadExams}
                variant="secondary"
                size="lg"
                icon={RefreshCw}
                className="h-14 px-8 rounded-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200/60 shadow-lg hover:shadow-xl"
              >
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-3xl shadow-xl border border-blue-200/60 p-8 sm:p-10 animate-fade-in-up hover-lift">
          <div className="text-center">
            <p className="text-gray-700 text-xl sm:text-2xl font-semibold">Consultez et participez à vos examens assignés</p>
            <p className="text-gray-600 text-sm sm:text-base mt-2">Interface moderne et intuitive pour une expérience optimale</p>
          </div>
        </div>

        {/* Filtres */}
        <Card className="p-8 sm:p-10 bg-white/95 rounded-3xl shadow-xl border border-gray-200/60 animate-fade-in-up hover-lift">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-700">Filtrer par statut :</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'all', label: 'Tous', count: examStats.total },
                  { key: 'assigned', label: 'Assignés', count: examStats.assigned },
                  { key: 'started', label: 'En cours', count: examStats.started },
                  { key: 'completed', label: 'Terminés', count: examStats.completed }
                ].map(({ key, label, count }) => (
                  <Button
                    key={key}
                    variant={filter === key ? 'primary' : 'ghost'}
                    size="lg"
                    onClick={() => setFilter(key as any)}
                    className="relative h-12 px-6 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    {label}
                    {count > 0 && (
                      <span className={`ml-3 px-3 py-1 text-xs rounded-full font-bold ${
                        filter === key 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-xl">
              {filteredExams.length} examen{filteredExams.length > 1 ? 's' : ''} trouvé{filteredExams.length > 1 ? 's' : ''}
            </div>
          </div>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <Card className="text-center p-6 sm:p-8 bg-gradient-to-br from-blue-50/90 to-blue-100/90 border border-blue-200/60 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in-scale hover-lift">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-3">{examStats.total}</div>
            <div className="text-sm sm:text-base font-semibold text-blue-700 uppercase tracking-wide">Total</div>
          </Card>
          <Card className="text-center p-6 sm:p-8 bg-gradient-to-br from-yellow-50/90 to-yellow-100/90 border border-yellow-200/60 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in-scale hover-lift">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-yellow-600 mb-3">{examStats.assigned}</div>
            <div className="text-sm sm:text-base font-semibold text-yellow-700 uppercase tracking-wide">Assignés</div>
          </Card>
          <Card className="text-center p-6 sm:p-8 bg-gradient-to-br from-orange-50/90 to-orange-100/90 border border-orange-200/60 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in-scale hover-lift">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-3">{examStats.started}</div>
            <div className="text-sm sm:text-base font-semibold text-orange-700 uppercase tracking-wide">En cours</div>
          </Card>
          <Card className="text-center p-6 sm:p-8 bg-gradient-to-br from-green-50/90 to-green-100/90 border border-green-200/60 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in-scale hover-lift">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-3">{examStats.completed}</div>
            <div className="text-sm sm:text-base font-semibold text-green-700 uppercase tracking-wide">Terminés</div>
          </Card>
        </div>

        {/* Contenu principal */}
        {loading ? (
          <Card className="p-16 bg-white rounded-3xl shadow-xl border border-gray-200">
            <LoadingSpinner size="lg" text="Chargement de vos examens..." />
          </Card>
        ) : error ? (
          <Card className="bg-white rounded-3xl shadow-xl border border-gray-200">
            <div className="text-center p-16">
              <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Erreur de chargement</h3>
              <p className="text-gray-600 mb-6 text-lg">{error}</p>
              <Button onClick={loadExams} size="lg" className="h-12 px-8 rounded-xl">
                Réessayer
              </Button>
            </div>
          </Card>
        ) : filteredExams.length === 0 ? (
          <Card className="p-16 bg-white rounded-3xl shadow-xl border border-gray-200">
            <EmptyState
              icon={BookOpen}
              title={filter === 'all' ? 'Aucun examen assigné' : 'Aucun examen trouvé'}
              description={
                filter === 'all' 
                  ? 'Vous n\'avez pas d\'examens assignés pour le moment. Contactez votre instructeur pour plus d\'informations.'
                  : 'Aucun examen ne correspond à ce filtre. Essayez de changer les critères de recherche.'
              }
              action={filter !== 'all' ? {
                label: 'Voir tous les examens',
                onClick: () => setFilter('all')
              } : undefined}
            />
          </Card>
        ) : (
          <div className="grid gap-8">
            {filteredExams.map((exam) => (
              <ModernExamCard
                key={exam.id}
                exam={exam}
                onStart={handleStartExam}
                onContinue={handleContinueExam}
                onView={handleViewExam}
                onDetails={handleDetailsExam}
                onDownloadPDF={downloadPDF}
              />
            ))}
          </div>
        )}

        {/* Modal des détails de l'examen */}
        <Modal
          isOpen={showExamDetails}
          onClose={closeExamDetails}
          title={selectedExam?.title}
          size="lg"
        >
          {selectedExam && (
            <div className="space-y-6">
              {selectedExam.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedExam.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Durée</h3>
                  <p className="text-gray-600">{selectedExam.duration_minutes} minutes</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Statut</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedExam.exam_status)}`}>
                    {getStatusIcon(selectedExam.exam_status)}
                    {getStatusText(selectedExam.exam_status)}
                  </span>
                </div>
              </div>
              
              {selectedExam.instructions && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedExam.instructions}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Assigné le {formatDate(selectedExam.assigned_at)}
                </div>
                <div className="flex gap-2">
                  {selectedExam.pdf_filename && (
                    <Button
                      onClick={() => downloadPDF(selectedExam.id)}
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Viewer d'examen */}
        {showExamViewer && selectedExam && (
          <ExamViewer
            exam={selectedExam}
            studentId={studentId}
            onBack={closeExamViewer}
            onExamComplete={handleExamComplete}
          />
        )}

      </div>
  );
}
