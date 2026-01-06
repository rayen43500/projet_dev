import { useState, useEffect } from 'react';
import { Download, ExternalLink, FileText, AlertCircle, Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut, X } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface PDFViewerProps {
  examId: string;
  title?: string;
  onClose?: () => void;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const API_BASE = 'http://localhost:8000/api/v1';

export default function PDFViewer({ 
  examId, 
  title, 
  onClose, 
  className = '',
  isFullscreen = false,
  onToggleFullscreen
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    loadPDF();
  }, [examId]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('pf_token');
      const url = `${API_BASE}/exams/${examId}/material`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!res.ok) {
        throw new Error('PDF non disponible');
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    } catch (err) {
      setError('Erreur lors du chargement du PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem('pf_token');
    const url = `${API_BASE}/exams/${examId}/material`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!res.ok) {
      setError('Impossible de télécharger le PDF');
      return;
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${title || 'examen'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  const handleOpenExternal = async () => {
    const token = localStorage.getItem('pf_token');
    const url = `${API_BASE}/exams/${examId}/material`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!res.ok) {
      setError('Impossible d\'ouvrir le PDF');
      return;
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const containerClasses = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white' 
    : `relative ${className}`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-500 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title || 'Document PDF'}
            </h3>
            <p className="text-sm text-gray-600">Examen #{examId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded-lg bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="px-2 py-1 text-sm text-gray-600 min-w-[3rem] text-center font-medium">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Rotate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          
          {/* Fullscreen */}
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
          
          {/* Download */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            icon={Download}
          >
            Télécharger
          </Button>
          
          {/* Open External */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenExternal}
            icon={ExternalLink}
          >
            Ouvrir
          </Button>
          
          {/* Close */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-100 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement du PDF...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="flex items-center justify-center h-96">
            <Card className="text-center max-w-md" variant="elevated">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-danger-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPDF} variant="primary">
                Réessayer
              </Button>
            </Card>
          </div>
        ) : pdfUrl ? (
          <div 
            className="w-full h-full overflow-auto"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top left'
            }}
          >
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={title || 'PDF Document'}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <Card className="text-center max-w-md" variant="elevated">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun PDF disponible</h3>
              <p className="text-gray-600">Ce document ne contient pas de PDF.</p>
            </Card>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <Badge variant="info" size="sm">
            PDF
          </Badge>
          <span>Zoom: {zoom}%</span>
          {rotation > 0 && <span>Rotation: {rotation}°</span>}
        </div>
        <div className="flex items-center space-x-2">
          <span>Examen #{examId}</span>
        </div>
      </div>
    </div>
  );
}