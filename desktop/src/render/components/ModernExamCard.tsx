//
import { BookOpen, Clock, FileText, Download, Play, Eye, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import type { Exam as ApiExam } from '../../services/api';

interface ModernExamCardProps {
  exam: ApiExam & {
    // tolerate optional fields if present
    status?: string;
    created_at?: string;
    pdf_size?: number;
    pdf_uploaded_at?: string;
  };
  onStart: (exam: ApiExam) => void;
  onContinue: (exam: ApiExam) => void;
  onView: (exam: ApiExam) => void;
  onDetails: (exam: ApiExam) => void;
  onDownloadPDF: (examId: string) => void;
}

export default function ModernExamCard({
  exam,
  onStart,
  onContinue,
  onView,
  onDetails,
  onDownloadPDF
}: ModernExamCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return {
          variant: 'info' as const,
          text: 'Assigné',
          icon: AlertCircle,
          color: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'started':
        return {
          variant: 'warning' as const,
          text: 'En cours',
          icon: Play,
          color: 'from-orange-500 to-orange-600',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700'
        };
      case 'completed':
        return {
          variant: 'success' as const,
          text: 'Terminé',
          icon: CheckCircle,
          color: 'from-green-500 to-green-600',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'failed':
        return {
          variant: 'danger' as const,
          text: 'Échoué',
          icon: AlertCircle,
          color: 'from-red-500 to-red-600',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
      default:
        return {
          variant: 'default' as const,
          text: 'Inconnu',
          icon: AlertCircle,
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
    }
  };

  const statusConfig = getStatusConfig(exam.exam_status);
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getActionButton = () => {
    switch (exam.exam_status) {
      case 'assigned':
        return (
          <Button
            onClick={() => onStart(exam)}
            variant="primary"
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Commencer l'examen
          </Button>
        );
      case 'started':
        return (
          <Button
            onClick={() => onContinue(exam)}
            variant="warning"
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Continuer
          </Button>
        );
      case 'completed':
        return (
          <Button
            onClick={() => onView(exam)}
            variant="secondary"
            size="sm"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Voir les résultats
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-white to-gray-50 overflow-hidden">
      {/* Header avec gradient */}
      <div className={`h-2 bg-gradient-to-r ${statusConfig.color}`}></div>
      
      <div className="p-6">
        {/* Header principal */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className={`p-3 rounded-xl shadow-lg bg-gradient-to-r ${statusConfig.color}`}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                {exam.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant={statusConfig.variant}
                  size="sm"
                  className={`${statusConfig.bgColor} ${statusConfig.textColor} font-medium px-3 py-1`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.text}
                </Badge>
                {exam.pdf_filename && (
                  <Badge variant="success" size="sm" className="bg-green-100 text-green-700 font-medium px-3 py-1">
                    <FileText className="w-3 h-3 mr-1" />
                    PDF disponible
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {exam.description && (
          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
            {exam.description}
          </p>
        )}

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <span className="font-medium">Durée :</span> {exam.duration_minutes} minutes
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <span className="font-medium">Assigné le :</span> {formatDate(exam.assigned_at)}
            </div>
          </div>

          {exam.pdf_filename && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <span className="font-medium">Fichier :</span> {exam.pdf_filename}
                {exam.pdf_size && (
                  <span className="text-gray-500 ml-1">({formatFileSize(exam.pdf_size)})</span>
                )}
              </div>
            </div>
          )}

          {exam.pdf_uploaded_at && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <span className="font-medium">Uploadé le :</span> {formatDate(exam.pdf_uploaded_at)}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {exam.instructions && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h4 className="font-medium text-blue-900 mb-2">Instructions :</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              {exam.instructions}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onDetails(exam)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Eye className="w-4 h-4 mr-1" />
              Détails
            </Button>
            
            {exam.pdf_filename && (
              <Button
                onClick={() => onDownloadPDF(exam.id)}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800"
              >
                <Download className="w-4 h-4 mr-1" />
                Télécharger PDF
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {getActionButton()}
          </div>
        </div>
      </div>
    </Card>
  );
}
