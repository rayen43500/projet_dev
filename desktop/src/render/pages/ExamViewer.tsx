import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Play, Pause, Square, Clock } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
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
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60); // en secondes
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [status, setStatus] = useState(exam.exam_status);
  const [showPDF, setShowPDF] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      
      const token = localStorage.getItem('pf_token');
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
      
      const token = localStorage.getItem('pf_token');
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
            <div className="pf-card">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Informations de l'examen</h2>
                {hasPdf && (
                  <button
                    onClick={loadPDF}
                    disabled={loading}
                    className="pf-button secondary flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {showPDF ? 'Masquer PDF' : 'Voir PDF'}
                  </button>
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
            </div>

            {/* Zone de travail */}
            <div className="pf-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone de travail</h3>
              {isCompleted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Examen terminé !</h4>
                  <p className="text-gray-600">Votre examen a été soumis avec succès.</p>
                </div>
              ) : status === 'assigned' ? (
                <div className="text-center py-8">
                  <Play className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Prêt à commencer ?</h4>
                  <p className="text-gray-600 mb-6">
                    Vous avez {exam.duration_minutes} minutes pour compléter cet examen.
                  </p>
                  <button
                    onClick={startExam}
                    disabled={loading}
                    className="pf-button primary text-lg px-8 py-3"
                  >
                    {loading ? 'Démarrage...' : 'Commencer l\'examen'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Examen en cours</h4>
                    <div className="flex gap-2">
                      {isRunning ? (
                        <button onClick={pauseExam} className="pf-button secondary flex items-center gap-2">
                          <Pause className="h-4 w-4" />
                          Pause
                        </button>
                      ) : (
                        <button onClick={resumeExam} className="pf-button primary flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Reprendre
                        </button>
                      )}
                      <button onClick={stopExam} className="pf-button danger flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        Terminer
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">Travaillez sur votre examen. Le temps restant est affiché en haut à droite.</p>
                  </div>
                </div>
              )}
            </div>

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
            <div className="pf-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Temps restant</h3>
              <div className="text-center">
                <div className={`text-4xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {isRunning ? 'En cours' : isCompleted ? 'Terminé' : 'En pause'}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="pf-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                {hasPdf && (
                  <button onClick={loadPDF} className="w-full pf-button secondary flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4" />
                    Voir le PDF
                  </button>
                )}
                {!isCompleted && status === 'assigned' && (
                  <button onClick={startExam} disabled={loading} className="w-full pf-button primary flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    Commencer
                  </button>
                )}
                {!isCompleted && status === 'started' && (
                  <button onClick={stopExam} className="w-full pf-button danger flex items-center justify-center gap-2">
                    <Square className="h-4 w-4" />
                    Terminer
                  </button>
                )}
              </div>
            </div>

            {/* Aide */}
            <div className="pf-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aide</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Cliquez sur "Commencer" pour démarrer l'examen</p>
                <p>• Le timer commence automatiquement</p>
                <p>• Vous pouvez mettre en pause et reprendre</p>
                <p>• Cliquez sur "Terminer" pour soumettre</p>
              </div>
            </div>
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
