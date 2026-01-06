import React from 'react';
import { BookOpen, Clock, FileText, Download, Play, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  instructions: string;
  status: string;
  pdf_filename: string | null;
  assigned_at: string;
  exam_status: string;
  created_at: string;
}

interface ExamCardProps {
  exam: Exam;
  onStart: (exam: Exam) => void;
  onContinue: (exam: Exam) => void;
  onView: (exam: Exam) => void;
  onDetails: (exam: Exam) => void;
  onDownloadPDF: (examId: string) => void;
}

export default function ExamCard({
  exam,
  onStart,
  onContinue,
  onView,
  onDetails,
  onDownloadPDF
}: ExamCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return {
          variant: 'info' as const,
          text: 'Assigné',
          icon: AlertCircle
        };
      case 'started':
        return {
          variant: 'warning' as const,
          text: 'En cours',
          icon: Play
        };
      case 'completed':
        return {
          variant: 'success' as const,
          text: 'Terminé',
          icon: CheckCircle
        };
      case 'failed':
        return {
          variant: 'danger' as const,
          text: 'Échoué',
          icon: AlertCircle
        };
      default:
        return {
          variant: 'default' as const,
          text: 'Inconnu',
          icon: AlertCircle
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

  const getActionButton = () => {
    switch (exam.exam_status) {
      case 'assigned':
        return (
          <Button
            onClick={() => onStart(exam)}
            variant="primary"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            Commencer
          </Button>
        );
      case 'started':
        return (
          <Button
            onClick={() => onContinue(exam)}
            variant="warning"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            Continuer
          </Button>
        );
      case 'completed':
        return (
          <Button
            onClick={() => onView(exam)}
            variant="secondary"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card hover className="group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {exam.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={statusConfig.variant}
                  icon={StatusIcon}
                >
                  {statusConfig.text}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {exam.description && (
            <p className="text-gray-600 mb-4 line-clamp-2">
              {exam.description}
            </p>
          )}
          
          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{exam.duration_minutes} minutes</span>
            </div>
            <div>
              Assigné le {formatDate(exam.assigned_at)}
            </div>
          </div>
          
          {/* Instructions Preview */}
          {exam.instructions && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-700 line-clamp-2">
                {exam.instructions}
              </p>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {exam.pdf_filename && (
            <Button
              onClick={() => onDownloadPDF(exam.id)}
              variant="ghost"
              size="sm"
              title="Télécharger le PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          
          {getActionButton()}
          
          <Button
            onClick={() => onDetails(exam)}
            variant="ghost"
            size="sm"
            title="Voir les détails"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
