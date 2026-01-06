import React, { useState } from 'react';
import { Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface SimplePDFViewerProps {
  examId: string;
  title?: string;
  onClose?: () => void;
  className?: string;
}

const API_BASE = 'http://localhost:8000/api/v1';

export default function SimplePDFViewer({ 
  examId, 
  title, 
  onClose, 
  className = '' 
}: SimplePDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `${API_BASE}/exams/${examId}/view`;
    link.download = `${title || 'examen'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    window.open(`${API_BASE}/exams/${examId}/view`, '_blank');
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {title || 'Document PDF'}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenExternal}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ouvrir
          </Button>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Fermer
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <Card className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            PDF de l'examen disponible
          </h4>
          
          <p className="text-gray-600 mb-6">
            Le document PDF de cet examen est prêt à être consulté. 
            Vous pouvez le télécharger ou l'ouvrir dans un nouvel onglet.
          </p>
          
          <div className="flex justify-center gap-3">
            <Button
              onClick={handleDownload}
              variant="secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            
            <Button
              onClick={handleOpenExternal}
              variant="primary"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir dans le navigateur
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
