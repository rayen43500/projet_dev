import { useEffect, useRef, useState } from 'react';
import { 
  Video, 
  Mic, 
  Wifi, 
  Play, 
  Square, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Shield,
  Activity,
  Camera,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

declare global {
  interface Window { electronAPI?: any }
}

export default function Surveillance(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Pre-exam checks
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [networkOk, setNetworkOk] = useState<boolean | null>(null);
  const [checksMessage, setChecksMessage] = useState<string | null>(null);

  // Timer and instructions
  const [durationSec, setDurationSec] = useState(60 * 60); // 1h par défaut
  const timerRef = useRef<number | null>(null);
  const [instructions] = useState<string>('Respectez les consignes de l\'examen. Les logiciels interdits sont bloqués.');

  function fmt(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(h)}:${p(m)}:${p(s)}`;
  }

  async function performPreChecks() {
    setChecksMessage(null);
    try {
      // Essayer directement d'obtenir les permissions comme dans Login
      // Cela fonctionne car les permissions sont déjà accordées pour l'authentification
      try {
        console.log('Tentative d\'accès direct aux périphériques...');
        
        // Essayer d'abord la caméra seule (comme dans Login)
        let videoStream: MediaStream | null = null;
        let audioStream: MediaStream | null = null;
        
        // Tester la vidéo d'abord (comme Identity.tsx)
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('Caméra accessible:', videoStream.getVideoTracks().length > 0);
          setCameraOk(videoStream.getVideoTracks().length > 0);
        } catch (videoError: any) {
          console.log('Erreur caméra:', videoError);
          setCameraOk(false);
        }
        
        // Tester l'audio séparément
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone accessible:', audioStream.getAudioTracks().length > 0);
          setMicOk(audioStream.getAudioTracks().length > 0);
        } catch (audioError: any) {
          console.log('Erreur microphone:', audioError);
          setMicOk(false);
        }
        
        // Nettoyer les streams
        if (videoStream) {
          videoStream.getTracks().forEach(track => track.stop());
        }
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }
        
        // Si les deux fonctionnent, essayer ensemble
        if (cameraOk && micOk) {
          try {
            const combinedStream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                width: { ideal: 640 },
                height: { ideal: 480 }
              }, 
              audio: true 
            });
            console.log('Stream combiné réussi:', combinedStream.getVideoTracks().length, 'vidéo,', combinedStream.getAudioTracks().length, 'audio');
            combinedStream.getTracks().forEach(track => track.stop());
          } catch (combinedError: any) {
            console.log('Erreur stream combiné:', combinedError);
            setChecksMessage('Caméra et microphone fonctionnent séparément mais pas ensemble.');
          }
        }
        
        // Messages d'erreur spécifiques
        if (!cameraOk && !micOk) {
          setChecksMessage('Aucun périphérique accessible. Vérifiez les permissions et les connexions.');
        } else if (!cameraOk) {
          setChecksMessage('Caméra non accessible. Vérifiez les permissions caméra.');
        } else if (!micOk) {
          setChecksMessage('Microphone non accessible. Vérifiez les permissions microphone.');
        }
        
      } catch (mediaError: any) {
        console.log('Erreur générale média:', mediaError);
        setCameraOk(false);
        setMicOk(false);
        
        // Messages d'erreur plus spécifiques
        if (mediaError.name === 'NotAllowedError') {
          setChecksMessage('Permissions refusées. Veuillez autoriser l\'accès à la caméra et au microphone.');
        } else if (mediaError.name === 'NotFoundError') {
          setChecksMessage('Caméra ou microphone non trouvé. Vérifiez vos périphériques.');
        } else if (mediaError.name === 'NotReadableError') {
          setChecksMessage('Caméra ou microphone déjà utilisé par une autre application.');
        } else if (mediaError.name === 'OverconstrainedError') {
          setChecksMessage('Paramètres de caméra/microphone non supportés par votre matériel.');
        } else {
          setChecksMessage(`Erreur d'accès aux périphériques: ${mediaError.message}`);
        }
      }

      // Vérification réseau améliorée
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const res = await fetch('http://localhost:8000/health', {
          signal: controller.signal,
          method: 'GET'
        });
        clearTimeout(timeoutId);
        setNetworkOk(res.ok);
        
        if (!res.ok) {
          setChecksMessage('Serveur de surveillance indisponible. Vérifiez la connexion.');
        }
      } catch (networkError: any) {
        setNetworkOk(false);
        if (networkError.name === 'AbortError') {
          setChecksMessage('Connexion au serveur timeout. Vérifiez que le serveur est démarré.');
        } else {
          setChecksMessage('Impossible de se connecter au serveur de surveillance.');
        }
      }

    } catch (e: any) {
      setChecksMessage(`Erreur générale: ${e.message}`);
      console.error('Erreur lors des vérifications:', e);
    }
  }

  async function start() {
    setRunning(true);
    try {
      // Utiliser exactement la même approche que Identity.tsx qui fonctionne
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      console.log('Stream vidéo obtenu avec succès');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Démarrer la session de surveillance
      try {
        await fetch('http://localhost:8000/api/v1/surveillance/start', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (serverError) {
        console.log('Serveur de surveillance non disponible:', serverError);
        setAlerts((a) => [...a, '⚠️ Serveur de surveillance indisponible - Surveillance locale uniquement']);
      }
      
      // Start periodic analysis
      if (!intervalRef.current) {
        intervalRef.current = window.setInterval(captureAndAnalyze, 2000);
      }
      // Start timer
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => {
          setDurationSec((d) => (d > 0 ? d - 1 : 0));
        }, 1000);
      }
      
      setAlerts((a) => [...a, '✅ Surveillance démarrée avec succès']);
      
    } catch (e: any) {
      setRunning(false);
      console.error('Erreur lors du démarrage:', e);
      
      let errorMessage = '❌ Erreur lors du démarrage de la surveillance';
      if (e.name === 'NotAllowedError') {
        errorMessage = '❌ Permissions refusées - Cliquez sur "Demander les Permissions" et autorisez l\'accès';
      } else if (e.name === 'NotFoundError') {
        errorMessage = '❌ Périphériques non trouvés - Vérifiez vos connexions et cliquez sur "Vérifier les Périphériques"';
      } else if (e.name === 'NotReadableError') {
        errorMessage = '❌ Périphériques déjà utilisés - Fermez les autres applications utilisant la caméra/micro';
      } else if (e.name === 'OverconstrainedError') {
        errorMessage = '❌ Paramètres non supportés - Votre matériel ne supporte pas les paramètres demandés';
      } else if (e.message === 'Aucun flux vidéo disponible') {
        errorMessage = '❌ Aucun flux vidéo - Vérifiez que votre caméra fonctionne correctement';
      } else {
        errorMessage = `❌ Erreur: ${e.message || e.name || 'Inconnue'}`;
      }
      
      setAlerts((a) => [...a, errorMessage]);
    }
  }

  async function stop() {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      video.srcObject = null;
    }
    await fetch('http://localhost:8000/api/v1/surveillance/stop', { method: 'POST' }).catch(() => {});
  }

  async function captureAndAnalyze() {
    try {
      if (!videoRef.current) return;
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const payload = { session_id: 'demo', video_frame: base64, timestamp: new Date().toISOString() } as const;
      const res = await fetch('http://localhost:8000/api/v1/surveillance/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) return;
      const json = await res.json();
      const newAlerts: string[] = (json.alerts || []).map((a: any) => `${a.severity?.toUpperCase() || 'INFO'}: ${a.message || a.type}`);
      if (newAlerts.length > 0) setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50));
    } catch {
      // ignore
    }
  }

  async function submitExam() {
    try {
      // Capture a last frame as evidence and upload (placeholder)
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        await fetch('http://localhost:8000/api/v1/records/upload', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'video', session_id: 'demo', timestamp: new Date().toISOString(), data: base64 })
        }).catch(() => {});
      }
      await stop();
      alert('✅ Examen terminé. Vos enregistrements ont été envoyés.');
    } catch {
      await stop();
      alert('✅ Examen terminé.');
    }
  }

  useEffect(() => {
    // Vérification automatique des permissions au chargement
    const checkPermissions = async () => {
      try {
        console.log('Vérification automatique des permissions...');
        
        // Essayer la caméra d'abord (comme dans Login)
        let videoOk = false;
        let audioOk = false;
        
        // Tester la vidéo d'abord (comme Identity.tsx)
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoOk = videoStream.getVideoTracks().length > 0;
          videoStream.getTracks().forEach(track => track.stop());
          console.log('Caméra auto-détectée:', videoOk);
        } catch (videoError) {
          console.log('Caméra non accessible:', videoError);
          videoOk = false;
        }
        
        // Tester l'audio séparément
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioOk = audioStream.getAudioTracks().length > 0;
          audioStream.getTracks().forEach(track => track.stop());
          console.log('Microphone auto-détecté:', audioOk);
        } catch (audioError) {
          console.log('Microphone non accessible:', audioError);
          audioOk = false;
        }
        
        setCameraOk(videoOk);
        setMicOk(audioOk);
        
        // Vérifier le réseau
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch('http://localhost:8000/api/v1/health', {
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          setNetworkOk(response.ok);
          console.log('Réseau auto-vérifié:', response.ok);
        } catch (networkError) {
          console.log('Réseau non accessible:', networkError);
          setNetworkOk(false);
        }
        
      } catch (error) {
        console.log('Erreur lors de la vérification automatique:', error);
      }
    };
    
    // Vérifier les permissions d'abord
    checkPermissions();
    
    // Auto-start if flagged by Exams
    try {
      const shouldAuto = sessionStorage.getItem('pf_autostart_surv') === '1';
      if (shouldAuto) {
        sessionStorage.removeItem('pf_autostart_surv');
        performPreChecks().then(start);
      }
    } catch {}

    // Subscribe to student warnings from main process
    const off = window.electronAPI?.onStudentWarning?.((payload: any) => {
      const msg = payload?.message || 'Application non autorisée détectée';
      // Popup in-app (non système)
      try {
        const container = document.getElementById('pf-toast-container') || (() => {
          const c = document.createElement('div');
          c.id = 'pf-toast-container';
          c.style.position = 'fixed';
          c.style.right = '16px';
          c.style.top = '16px';
          c.style.zIndex = '99999';
          document.body.appendChild(c);
          return c;
        })();
        const toast = document.createElement('div');
        toast.style.background = '#111827';
        toast.style.color = 'white';
        toast.style.padding = '10px 12px';
        toast.style.marginTop = '8px';
        toast.style.borderRadius = '6px';
        toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => { container.removeChild(toast); }, 4000);
      } catch {}
      setAlerts((prev) => [`WARNING: ${msg}`, ...prev].slice(0, 50));
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof off === 'function') off();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header supprimé comme demandé */}

      {/* Vérifications préalables */}
  <Card className="p-6 card-elevated animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Vérifications Préalables</h3>
        </div>
        
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 ${
            cameraOk === null 
              ? 'bg-gray-50 border-gray-200' 
              : cameraOk 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
              cameraOk === null 
                ? 'bg-gray-200' 
                : cameraOk 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
            }`}>
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-gray-700">Caméra</p>
              <p className="text-xs sm:text-sm text-gray-600">
                {cameraOk === null ? 'Non vérifiée' : cameraOk ? 'Fonctionnelle' : 'Non détectée'}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 ${
            micOk === null 
              ? 'bg-gray-50 border-gray-200' 
              : micOk 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
              micOk === null 
                ? 'bg-gray-200' 
                : micOk 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
            }`}>
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-gray-700">Microphone</p>
              <p className="text-xs sm:text-sm text-gray-600">
                {micOk === null ? 'Non vérifié' : micOk ? 'Fonctionnel' : 'Non détecté'}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 ${
            networkOk === null 
              ? 'bg-gray-50 border-gray-200' 
              : networkOk 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
              networkOk === null 
                ? 'bg-gray-200' 
                : networkOk 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
            }`}>
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-gray-700">Réseau</p>
              <p className="text-xs sm:text-sm text-gray-600">
                {networkOk === null ? 'Non vérifié' : networkOk ? 'Connecté' : 'Indisponible'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={performPreChecks}
              variant="secondary"
              size="lg"
              icon={Activity}
              className="btn btn-ghost h-12 px-6 rounded-xl text-contrast-safe"
            >
              Vérifier les Périphériques
            </Button>
            <Button
              onClick={async () => {
                setCameraOk(null);
                setMicOk(null);
                setNetworkOk(null);
                setChecksMessage(null);
                setAlerts([]);
                await performPreChecks();
              }}
              variant="secondary"
              size="lg"
              icon={RefreshCw}
              className="btn btn-ghost h-12 px-6 rounded-xl text-contrast-safe"
            >
              Réinitialiser
            </Button>
            {(cameraOk === false || micOk === false) && (
              <Button
                onClick={async () => {
                  try {
                    setChecksMessage('Demande des permissions en cours...');
                    
                    // Utiliser la même approche que Login - essayer séparément
                    let videoSuccess = false;
                    let audioSuccess = false;
                    
                    // Utiliser exactement la même approche que Identity.tsx
                    try {
                      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                      videoSuccess = videoStream.getVideoTracks().length > 0;
                      videoStream.getTracks().forEach(track => track.stop());
                      console.log('Caméra testée:', videoSuccess);
                    } catch (videoError) {
                      console.log('Erreur caméra:', videoError);
                    }
                    
                    try {
                      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      audioSuccess = audioStream.getAudioTracks().length > 0;
                      audioStream.getTracks().forEach(track => track.stop());
                      console.log('Microphone testé:', audioSuccess);
                    } catch (audioError) {
                      console.log('Erreur microphone:', audioError);
                    }
                    
                    // Mettre à jour les états
                    setCameraOk(videoSuccess);
                    setMicOk(audioSuccess);
                    setChecksMessage(null);
                    
                    if (videoSuccess && audioSuccess) {
                      setAlerts((a) => [...a, '✅ Permissions accordées - Caméra et microphone détectés']);
                    } else if (videoSuccess) {
                      setAlerts((a) => [...a, '⚠️ Caméra détectée mais microphone non disponible']);
                    } else if (audioSuccess) {
                      setAlerts((a) => [...a, '⚠️ Microphone détecté mais caméra non disponible']);
                    } else {
                      setAlerts((a) => [...a, '❌ Aucun périphérique accessible. Vérifiez les permissions.']);
                    }
                    
                  } catch (e: any) {
                    console.error('Erreur lors de la demande de permissions:', e);
                    setChecksMessage(`Erreur: ${e.message}`);
                    setAlerts((a) => [...a, `❌ Erreur permissions: ${e.message}`]);
                  }
                }}
                variant="primary"
                size="lg"
                icon={Camera}
                className="btn btn-primary h-12 px-6 rounded-xl"
              >
                Demander les Permissions
              </Button>
            )}
          </div>
          {checksMessage && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
              {checksMessage}
            </div>
          )}
        </div>
      </Card>

      {/* Contrôles et Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer et Instructions */}
  <Card className="p-6 card-elevated animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-indigo-600 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Temps Restant</h3>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
              {fmt(durationSec)}
            </div>
            <div className="text-sm text-gray-600">Heures : Minutes : Secondes</div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Instructions</h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-700">{instructions}</p>
            </div>
          </div>
        </Card>

        {/* Contrôles de Surveillance */}
  <Card className="p-6 card-elevated animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Contrôles</h3>
          </div>

          <div className="space-y-4">
            {!running ? (
              <Button
                onClick={start}
                variant="primary"
                size="lg"
                icon={Play}
                className="w-full h-12 rounded-xl text-lg font-semibold"
              >
                Démarrer la Surveillance
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={stop}
                  variant="danger"
                  size="lg"
                  icon={Square}
                  className="w-full h-12 rounded-xl text-lg font-semibold"
                >
                  Arrêter la Surveillance
                </Button>
                <Button
                  onClick={submitExam}
                  variant="success"
                  size="lg"
                  icon={CheckCircle}
                  className="w-full h-12 rounded-xl text-lg font-semibold"
                >
                  Soumettre l'Examen
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Interface de Surveillance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Caméra */}
        <div className="xl:col-span-2">
          <Card className="p-6 card-elevated animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Vue Caméra</h3>
            </div>
            
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              <video 
                ref={videoRef} 
                className="w-full h-64 sm:h-80 object-cover"
                style={{ background: '#111827' }}
              />
              {!running && (
                <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-lg font-semibold">Caméra non active</p>
                    <p className="text-sm opacity-75">Démarrez la surveillance pour voir le flux vidéo</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Alertes */}
        <div>
          <Card className="p-6 card-elevated animate-fade-in-up h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Alertes</h3>
              {alerts.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Aucune alerte</p>
                  <p className="text-xs">Le système surveille en temps réel</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {alerts.map((alert, i) => (
                    <div 
                      key={i} 
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-fade-in-up"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{alert}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


