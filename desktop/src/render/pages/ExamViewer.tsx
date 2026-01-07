import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Play, Pause, Square, Clock, Video, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import type { Exam as ApiExam } from '../../services/api';

type Exam = ApiExam & { pdf_path?: string | null };

interface ExamViewerProps {
  exam: Exam;
  studentId: number;
  onBack: () => void;
  onExamComplete: () => void;
}

const API_BASE = 'http://localhost:8000/api/v1';

export default function ExamViewer({ exam, studentId, onBack, onExamComplete }: ExamViewerProps): JSX.Element {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60); // en secondes
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [status, setStatus] = useState(exam.exam_status);
  const [showPDF, setShowPDF] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveillanceStarted, setSurveillanceStarted] = useState(false);
  const hasPdf = Boolean(exam.pdf_filename || (exam as any).pdf_path);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleCompleteExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async function startExam() {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      }
      const response = await fetch(`${API_BASE}/exams/${exam.id}/start?student_id=${studentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors du démarrage de l\'examen');
      }

      setIsRunning(true);
      setStatus('started');
      // Ouvrir automatiquement le PDF à démarrage
      setShowPDF(true);
      
      // Démarrer automatiquement la surveillance
      startSurveillance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteExam() {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      }
      const response = await fetch(`${API_BASE}/exams/${exam.id}/submit?student_id=${studentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: {} })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la finalisation de l\'examen');
      }

  setIsCompleted(true);
  setStatus('completed');
      setIsRunning(false);
      onExamComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  function pauseExam() {
    setIsRunning(false);
  }

  function resumeExam() {
    setIsRunning(true);
  }

  function stopExam() {
    setIsRunning(false);
    handleCompleteExam();
  }

  async function loadPDF() {
    setShowPDF(true);
  }

  function startSurveillance() {
    try {
      // Stocker un flag pour demander démarrage auto
      sessionStorage.setItem('pf_autostart_surv', '1');
      sessionStorage.setItem('pf_exam_id', exam.id);
      sessionStorage.setItem('pf_student_id', studentId.toString());
      setSurveillanceStarted(true);
      
      // Naviguer vers la page de surveillance dans un nouvel onglet/fenêtre si possible
      // Sinon, ouvrir dans la même page
      navigate('/surveillance');
    } catch (err) {
      console.error('Erreur lors du démarrage de la surveillance:', err);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Retour
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                {getStatusText(status)}
              </span>
              
              {!isCompleted && (
                <div className="flex items-center gap-2 text-lg font-mono">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className={`${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de l'examen */}
            <Card className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Informations de l'examen</h2>
                {hasPdf && (
                  <Button
                    onClick={loadPDF}
                    disabled={loading}
                    variant="secondary"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {showPDF ? 'Masquer PDF' : 'Voir PDF'}
                  </Button>
                )}
              </div>
              
              {exam.description && (
                <p className="text-gray-600 mb-4">{exam.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Durée :</span>
                  <span className="ml-2 text-gray-600">{exam.duration_minutes} minutes</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Assigné le :</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(exam.assigned_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              
              {exam.instructions && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{exam.instructions}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Zone de travail */}
            <Card className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone de travail</h3>
              {isCompleted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Examen terminé !</h4>
                  <p className="text-gray-600">Votre examen a été soumis avec succès.</p>
                </div>
              ) : status === 'assigned' ? (
                <div className="text-center py-8 space-y-6">
                  <div>
                    <Play className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Prêt à commencer ?</h4>
                    <p className="text-gray-600 mb-6">
                      Vous avez {exam.duration_minutes} minutes pour compléter cet examen.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      onClick={startExam}
                      disabled={loading}
                      variant="primary"
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl px-8 py-3 text-base font-semibold min-w-[200px]"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Démarrage...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Démarrer l'examen
                        </>
                      )}
                    </Button>
                    
                    {!surveillanceStarted && (
                      <Button
                        onClick={startSurveillance}
                        variant="secondary"
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl px-8 py-3 text-base font-semibold min-w-[200px]"
                      >
                        <Video className="w-5 h-5 mr-2" />
                        Démarrer la surveillance
                      </Button>
                    )}
                    
                    {surveillanceStarted && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                        <Shield className="w-5 h-5" />
                        <span className="font-semibold">Surveillance active</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Important :</strong> La surveillance vidéo et audio sera activée automatiquement lorsque vous démarrerez l'examen. Assurez-vous que votre caméra et votre micro sont fonctionnels.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Examen en cours</h4>
                    <div className="flex gap-2">
                      {isRunning ? (
                        <Button onClick={pauseExam} variant="secondary" size="md">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button onClick={resumeExam} variant="primary" size="md">
                          <Play className="h-4 w-4 mr-2" />
                          Reprendre
                        </Button>
                      )}
                      <Button onClick={stopExam} variant="danger" size="md">
                        <Square className="h-4 w-4 mr-2" />
                        Terminer
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">Travaillez sur votre examen. Le temps restant est affiché en haut à droite.</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Affichage du PDF */}
            {showPDF && (
              <PDFViewer
                examId={exam.id}
                title={exam.title}
                onClose={() => setShowPDF(false)}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timer */}
            <Card className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Temps restant</h3>
              <div className="text-center">
                <div className={`text-4xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {isRunning ? 'En cours' : isCompleted ? 'Terminé' : 'En pause'}
                </div>
              </div>
            </Card>

            {/* Actions rapides */}
            <Card className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {hasPdf && (
                  <Button
                    onClick={loadPDF}
                    variant="secondary"
                    size="md"
                    className="w-full justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Voir le PDF
                  </Button>
                )}
                {!isCompleted && status === 'assigned' && (
                  <>
                    <Button
                      onClick={startExam}
                      disabled={loading}
                      variant="primary"
                      size="lg"
                      className="w-full justify-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Démarrage...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Démarrer l'examen
                        </>
                      )}
                    </Button>
                    {!surveillanceStarted && (
                      <Button
                        onClick={startSurveillance}
                        variant="secondary"
                        size="md"
                        className="w-full justify-center bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Activer la surveillance
                      </Button>
                    )}
                    {surveillanceStarted && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-semibold">Surveillance active</span>
                      </div>
                    )}
                  </>
                )}
                {!isCompleted && status === 'started' && (
                  <Button
                    onClick={stopExam}
                    variant="danger"
                    size="md"
                    className="w-full justify-center"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Terminer l'examen
                  </Button>
                )}
              </div>
            </Card>

            {/* Aide */}
            <Card className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aide</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Cliquez sur "Commencer" pour démarrer l'examen</p>
                <p>• Le timer commence automatiquement</p>
                <p>• Vous pouvez mettre en pause et reprendre</p>
                <p>• Cliquez sur "Terminer" pour soumettre</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
