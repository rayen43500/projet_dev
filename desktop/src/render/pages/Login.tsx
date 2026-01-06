import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Camera, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

export default function Login(): JSX.Element {
  const [email, setEmail] = useState('student@test.com');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'classic' | 'face'>('classic');
  const navigate = useNavigate();
  const { login } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      await login(email, password);
      setMessage('✅ Connexion réussie');
      
      // Rediriger vers la page des examens
      setTimeout(() => {
        navigate('/exams');
      }, 1000);
      
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function ensureCamera() {
    setFaceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (e: any) {
      setFaceError("Caméra indisponible. Autorisez l'accès puis réessayez.");
      return false;
    }
  }

  function stopCamera() {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function loginWithFace() {
    setLoading(true);
    setMessage(null);
    
    try {
      // Démarrer caméra et capturer une image
      const ok = await ensureCamera();
      if (!ok) throw new Error('Caméra requise');
      setMessage('📷 Reconnaissance faciale en cours...');

      // Capture image
      const video = videoRef.current!;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      
      // Note: L'endpoint login-with-face n'existe pas encore dans le backend
      // Pour l'instant, on utilise la connexion classique après capture
      // TODO: Implémenter l'endpoint /auth/login-with-face dans le backend
      setMessage('⚠️ La connexion par reconnaissance faciale n\'est pas encore disponible. Utilisez la connexion classique.');
      
      // Optionnel: on pourrait faire une vérification d'identité puis login classique
      // Pour l'instant, on désactive cette fonctionnalité
      throw new Error('Connexion faciale non disponible. Utilisez la connexion classique.');
      
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      stopCamera();
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/25 hover-lift">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-3">
            ProctoFlex AI
          </h1>
          <p className="text-blue-100 text-lg">Connexion à votre espace étudiant</p>
        </div>

        {/* Card de connexion */}
        <Card variant="elevated" padding="lg" className="mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-xl animate-fade-in-scale hover-lift">
          {/* Méthodes de connexion */}
          <div className="flex space-x-3 mb-8">
            <Button
              variant={loginMethod === 'classic' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLoginMethod('classic')}
              className="flex-1 transition-all duration-300"
            >
              <User className="w-4 h-4 mr-2" />
              Classique
            </Button>
            <Button
              variant={loginMethod === 'face' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLoginMethod('face')}
              className="flex-1 transition-all duration-300"
            >
              <Camera className="w-4 h-4 mr-2" />
              Faciale
            </Button>
          </div>

          {/* Formulaire de connexion classique */}
          {loginMethod === 'classic' && (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={User}
                  placeholder="Votre adresse email"
                  required
                  className="transition-all duration-300"
                />
                
                <Input
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  iconPosition="right"
                  placeholder="Votre mot de passe"
                  required
                  className="transition-all duration-300"
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full h-12 text-lg font-semibold transition-all duration-300 hover:scale-105"
                icon={LogIn}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          )}

          {/* Connexion par reconnaissance faciale */}
          {loginMethod === 'face' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Fonctionnalité en développement
                    </p>
                    <p className="text-xs text-amber-700">
                      La connexion par reconnaissance faciale n'est pas encore disponible. 
                      Veuillez utiliser la connexion classique avec email et mot de passe.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-black rounded-lg overflow-hidden opacity-50">
                  <video ref={videoRef} className="w-full h-56 object-cover" />
                </div>
                {faceError && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">{faceError}</div>
                )}
              </div>
              
              <Button
                onClick={() => {
                  setMessage('⚠️ La connexion par reconnaissance faciale n\'est pas encore disponible. Utilisez la connexion classique.');
                  setLoginMethod('classic');
                }}
                variant="outline"
                size="lg"
                className="w-full h-12 text-lg font-semibold transition-all duration-300"
                icon={User}
              >
                Utiliser la connexion classique
              </Button>
            </div>
          )}

          {/* Message de statut */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl flex items-center transition-all duration-300 ${
              message.startsWith('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm' 
                : 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
            }`}>
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </Card>

        {/* Informations de test */}
        <Card variant="filled" padding="md" className="bg-white/90 backdrop-blur-sm border-0 shadow-lg animate-fade-in-up hover-lift">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Comptes de test</h3>
          <div className="space-y-3 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-medium">Email :</span>
              <Badge variant="info" size="xs" className="font-mono">student@test.com</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Mot de passe :</span>
              <Badge variant="info" size="xs" className="font-mono">student123</Badge>
            </div>
          </div>
        </Card>

        {/* Lien vers l'inscription */}
        <div className="text-center mt-8">
          <p className="text-sm text-blue-100">
            Pas encore de compte ?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-white hover:text-blue-200 font-semibold transition-colors duration-300 underline decoration-2 underline-offset-2"
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}