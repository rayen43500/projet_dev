import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

export default function Register(): JSX.Element {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Le nom complet est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await register({
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        face_image_base64: capturedFace || undefined
      });
      
      setMessage('✅ Inscription réussie ! Vous êtes maintenant connecté.');
      
      setTimeout(() => {
        navigate('/exams');
      }, 2000);
      
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setCameraError('Impossible d\'accéder à la caméra. Vous pouvez continuer sans photo.');
      setUseCamera(false);
    }
  }

  function stopCamera() {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function capturePhoto() {
    try {
      const video = videoRef.current;
      if (!video) return;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedFace(dataUrl.split(',')[1]);
    } catch {
      setCameraError('Capture échouée. Continuez sans photo.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl mb-6 shadow-2xl shadow-green-500/25 hover-lift">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent mb-3">
            Créer un compte
          </h1>
          <p className="text-blue-100 text-lg">Rejoignez ProctoFlex AI</p>
        </div>

        {/* Card d'inscription */}
        <Card variant="elevated" padding="lg" className="mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-2xl animate-fade-in-scale hover-lift">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                icon={User}
                placeholder="Votre nom d'utilisateur"
                error={errors.username}
                helperText="Minimum 3 caractères"
                required
                className="transition-all duration-300"
              />
              
              <Input
                label="Nom complet"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                icon={User}
                placeholder="Votre nom complet"
                error={errors.full_name}
                required
                className="transition-all duration-300"
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                icon={Mail}
                placeholder="votre@email.com"
                error={errors.email}
                required
                className="transition-all duration-300"
              />
              
              <Input
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                icon={Lock}
                placeholder="Votre mot de passe"
                error={errors.password}
                helperText="Minimum 6 caractères"
                required
                className="transition-all duration-300"
              />
              
              <Input
                label="Confirmer le mot de passe"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                icon={Lock}
                placeholder="Confirmez votre mot de passe"
                error={errors.confirmPassword}
                required
                className="transition-all duration-300"
              />
            </div>

            {/* Section caméra optionnelle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Utiliser la caméra (optionnel)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !useCamera;
                    setUseCamera(next);
                    if (next) startCamera(); else { stopCamera(); setCapturedFace(null); setCameraError(null); }
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${useCamera ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'} hover:shadow transition`}
                >
                  {useCamera ? 'Désactiver' : 'Activer'}
                </button>
              </div>

              {useCamera && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600">Cadrez votre visage puis capturez.</div>
                  <div className="bg-black">
                    <video ref={videoRef} className="w-full h-56 object-cover" />
                  </div>
                  <div className="p-3 flex items-center gap-3">
                    <Button type="button" variant="secondary" size="sm" onClick={capturePhoto}>Capturer la photo</Button>
                    {capturedFace && <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">Photo capturée</span>}
                    {cameraError && <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">{cameraError}</span>}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full h-12 text-lg font-semibold transition-all duration-300 hover:scale-105"
              icon={UserPlus}
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>
          </form>

          {/* Message de statut */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl flex items-center transition-all duration-300 ${
              message.startsWith('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm' 
                : 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
            }`}>
              {message.startsWith('✅') ? (
                <CheckCircle className="w-5 h-5 mr-3" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </Card>

        {/* Informations */}
        <Card variant="filled" padding="md" className="bg-white/90 backdrop-blur-sm border-0 shadow-lg animate-fade-in-up hover-lift">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">À propos de l'inscription</h3>
          <div className="space-y-3 text-xs text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
              <span className="font-medium">Reconnaissance faciale incluse</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
              <span className="font-medium">Accès immédiat aux examens</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
              <span className="font-medium">Interface moderne et intuitive</span>
            </div>
          </div>
        </Card>

        {/* Lien vers la connexion */}
        <div className="text-center mt-8">
          <p className="text-sm text-blue-100">
            Déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-white hover:text-blue-200 font-semibold transition-colors duration-300 underline decoration-2 underline-offset-2"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}