import React, { useRef, useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, User, Shield } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

export default function Identity(): JSX.Element {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Nettoyer le stream au démontage
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function startCamera() {
    try {
      setIsLoading(true);
      setStatus('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setStatus('✅ Caméra démarrée avec succès');
      setIsLoading(false);
    } catch (e: any) {
      setStatus(`❌ Caméra indisponible: ${e.message}`);
      setCameraActive(false);
      setIsLoading(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStatus('Caméra arrêtée');
  }

  async function verify() {
    try {
      setIsLoading(true);
      setStatus('Vérification en cours...');
      setVerified(null);
      
      if (!videoRef.current || !cameraActive) {
        throw new Error('Veuillez d\'abord démarrer la caméra');
      }

      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Impossible de créer le contexte canvas');
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      
      const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
      const res = await fetch('http://localhost:8000/api/v1/ai/verify_identity', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          face_image_base64: base64, 
          id_image_base64: base64 
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la vérification');
      }

      const json = await res.json();
      const isVerified = json.verified === true;
      setVerified(isVerified);
      setStatus(isVerified ? '✅ Identité vérifiée avec succès' : '❌ Échec de la vérification d\'identité');
      setIsLoading(false);
    } catch (e: any) {
      setStatus(`❌ Erreur: ${e.message}`);
      setVerified(false);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 rounded-3xl shadow-xl border border-gray-200/60 p-8 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vérification d'identité</h2>
            <p className="text-gray-600 mt-1">Vérifiez votre identité avant de commencer un examen</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name || 'Étudiant'}</p>
              <p className="text-sm text-gray-600">{user.email || 'user@example.com'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone de capture vidéo */}
        <Card className="p-6 bg-white rounded-3xl shadow-xl border border-gray-200 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Capture vidéo
          </h3>
          
          <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4">
            <video 
              ref={videoRef} 
              className="w-full h-auto max-h-96"
              autoPlay
              playsInline
              muted
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-gray-400">
                  <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>Caméra inactive</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!cameraActive ? (
              <Button
                onClick={startCamera}
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                {isLoading ? 'Démarrage...' : 'Démarrer la caméra'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={verify}
                  variant="success"
                  size="lg"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Vérification...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Vérifier l'identité
                    </>
                  )}
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="secondary"
                  size="lg"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Arrêter
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Résultats et statut */}
        <Card className="p-6 bg-white rounded-3xl shadow-xl border border-gray-200 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Statut de vérification
          </h3>

          {status && (
            <div className={`p-4 rounded-xl mb-4 ${
              verified === true 
                ? 'bg-green-50 border border-green-200' 
                : verified === false 
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                {verified === true ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                ) : verified === false ? (
                  <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Camera className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                <p className={`font-medium ${
                  verified === true 
                    ? 'text-green-800' 
                    : verified === false 
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}>
                  {status}
                </p>
              </div>
            </div>
          )}

          {verified !== null && (
            <div className="mt-4">
              <Badge 
                variant={verified ? 'success' : 'danger'}
                size="lg"
                className="text-base px-4 py-2"
              >
                {verified ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Identité vérifiée
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Vérification échouée
                  </>
                )}
              </Badge>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Instructions :</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Assurez-vous d'être dans un environnement bien éclairé</li>
              <li>Positionnez-vous face à la caméra</li>
              <li>Cliquez sur "Démarrer la caméra" pour activer la capture</li>
              <li>Cliquez sur "Vérifier l'identité" pour lancer la vérification</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
