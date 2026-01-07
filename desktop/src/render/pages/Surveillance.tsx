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
  RefreshCw,
  FileText
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window { electronAPI?: any }
}

export default function Surveillance(): JSX.Element {
  // Injecter les styles CSS pour les animations de toast
  useEffect(() => {
    const styleId = 'pf-toast-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Nettoyer le style à la démontage (optionnel)
    };
  }, []);
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const lastAlertTime = useRef<Record<string, number>>({}); // Pour éviter le spam d'alertes

  // Pre-exam checks
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [networkOk, setNetworkOk] = useState<boolean | null>(null);
  const [checksMessage, setChecksMessage] = useState<string | null>(null);

  // Timer and instructions
  const [durationSec, setDurationSec] = useState(60 * 60); // 1h par défaut
  const timerRef = useRef<number | null>(null);
  const [instructions] = useState<string>('Respectez les consignes de l\'examen. Les logiciels interdits sont bloqués.');

  // Face tracking (cadre jaune)
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Ouverture rapide du PDF de l'examen depuis l'écran de surveillance
  async function openExamPdf() {
    try {
      const examId = sessionStorage.getItem('pf_exam_id');
      const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
      if (!examId || !token) {
        alert('Aucun examen actif ou vous n\'êtes pas authentifié.');
        return;
      }

      const url = `http://localhost:8000/api/v1/exams/${examId}/material`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert('Impossible d\'ouvrir le PDF de l\'examen.');
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
    } catch (e) {
      console.error('Erreur lors de l\'ouverture du PDF:', e);
      alert('Erreur lors de l\'ouverture du PDF de l\'examen.');
    }
  }

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
          setChecksMessage('⚠️ Caméra non accessible. La surveillance nécessite une caméra fonctionnelle.');
        } else if (!micOk) {
          setChecksMessage('ℹ️ Microphone non détecté. La surveillance vidéo peut continuer sans audio.');
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
      // Essayer d'abord avec vidéo et audio
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Stream vidéo + audio obtenu avec succès');
      } catch (audioError: any) {
        // Si l'audio échoue, essayer seulement avec la vidéo
        console.warn('Microphone non disponible, démarrage avec vidéo uniquement:', audioError.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('Stream vidéo obtenu avec succès (sans audio)');
          // Message informatif mais pas alarmant
          setAlerts((a) => [...a, 'ℹ️ Surveillance démarrée en mode vidéo uniquement (microphone non disponible)']);
        } catch (videoError: any) {
          throw new Error(`Impossible d'accéder à la caméra: ${videoError.message}`);
        }
      }
      
      if (!stream) {
        throw new Error('Aucun flux média disponible');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Démarrer la session de surveillance
      try {
        const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
        let examId = sessionStorage.getItem('pf_exam_id');
        let studentId = sessionStorage.getItem('pf_student_id');
        
        // Si pas dans sessionStorage, essayer de récupérer depuis le contexte d'authentification
        if (!studentId && user?.id) {
          studentId = user.id.toString();
          sessionStorage.setItem('pf_student_id', studentId);
          console.log('📝 Student ID récupéré depuis AuthContext:', studentId);
        }
        
        // Si pas d'examen dans sessionStorage, essayer de trouver un examen actif depuis l'API
        if (!examId && studentId && token) {
          try {
            const examsResponse = await fetch(`http://localhost:8000/api/v1/exams?student_id=${studentId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (examsResponse.ok) {
              const examsData = await examsResponse.json();
              // Trouver le premier examen actif ou assigné
              const activeExam = Array.isArray(examsData) ? examsData.find((e: any) => 
                e.is_active && (e.exam_status === 'assigned' || e.exam_status === 'started')
              ) : null;
              
              if (activeExam && activeExam.id) {
                examId = activeExam.id.toString();
                if (examId) {
                  sessionStorage.setItem('pf_exam_id', examId);
                  console.log('📝 Examen actif trouvé depuis l\'API:', examId);
                }
              }
            }
          } catch (examFetchError) {
            console.log('Impossible de récupérer les examens:', examFetchError);
          }
        }
        
        console.log('🔍 Tentative de démarrage de session:', { examId, studentId, hasToken: !!token, userId: user?.id });
        
        if (examId && studentId) {
          const response = await fetch('http://localhost:8000/api/v1/surveillance/start-session', { 
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({
              exam_id: parseInt(examId),
              student_id: parseInt(studentId),
              identity_verified: false  // Peut être fait après
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Session créée avec succès:', data);
            // Stocker le session_id pour l'analyse
            if (data.session_id) {
              sessionStorage.setItem('pf_session_id', data.session_id.toString());
              console.log('📝 Session ID stocké:', data.session_id);
              
              // Envoyer une alerte informative au backend pour le dashboard admin
              try {
                const alertResponse = await fetch('http://localhost:8000/api/v1/alerts', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({
                    type: 'session_started',
                    severity: 'low',
                    description: `Session de surveillance démarrée (ID: ${data.session_id})`,
                    session_id: data.session_id,
                    exam_id: parseInt(examId || '0'),
                    student_id: parseInt(studentId || '0')
                  })
                });
                if (alertResponse.ok) {
                  console.log('✅ Alerte de démarrage envoyée au dashboard admin');
                }
              } catch (alertError) {
                console.log('Note: Alerte de démarrage non envoyée (non critique):', alertError);
              }
            }
            setAlerts((a) => [...a, `✅ Session de surveillance démarrée (ID: ${data.session_id})`]);
          } else {
            const errorText = await response.text();
            console.error('❌ Erreur démarrage session:', response.status, errorText);
            setAlerts((a) => [...a, `⚠️ Erreur serveur (${response.status}): ${errorText.substring(0, 100)}`]);
          }
        } else {
          console.warn('⚠️ Pas d\'examen actif:', { examId, studentId, userId: user?.id });
          // Stocker quand même le studentId si disponible pour le monitoring des processus
          if (studentId && !sessionStorage.getItem('pf_student_id')) {
            sessionStorage.setItem('pf_student_id', studentId);
          }
          setAlerts((a) => [...a, '⚠️ Aucun examen actif - Surveillance locale uniquement']);
        }
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
    // Arrêter la session de surveillance si elle existe
    try {
      const sessionId = sessionStorage.getItem('pf_session_id');
      const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
      
      if (sessionId) {
        await fetch(`http://localhost:8000/api/v1/surveillance/session/${sessionId}/end`, {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }).catch(() => {});
        sessionStorage.removeItem('pf_session_id');
      }
    } catch {
      // Ignorer les erreurs lors de l'arrêt
    }
  }

  async function captureAndAnalyze() {
    try {
      if (!videoRef.current) return;
      
      // Récupérer le session_id depuis sessionStorage
      const sessionId = sessionStorage.getItem('pf_session_id');
      if (!sessionId) {
        // Pas de session active, ne pas envoyer d'analyse
        return;
      }
      
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
      
      // L'endpoint attend session_id en query param et video_frame en body
      const res = await fetch(`http://localhost:8000/api/v1/surveillance/analyze?session_id=${sessionId}`, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }, 
        body: JSON.stringify({
          video_frame: base64,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!res.ok) {
        // Ne pas spammer les erreurs si c'est juste une erreur de validation
        if (res.status !== 422) {
          console.log('Erreur analyse:', res.status, await res.text().catch(() => ''));
        }
        return;
      }
      
      const json = await res.json();
      console.log('📊 Résultat analyse:', json);
      
      // Le backend retourne une liste d'alertes créées avec détails
      // Note: json.alerts_created est un nombre, pas un booléen
      const alertsCount = json.alerts_created || 0;
      const alertDetails = json.alert_details || [];
      const alertIds = json.alert_ids || [];
      
      if (alertsCount > 0 && (alertDetails.length > 0 || alertIds.length > 0)) {
        console.log('🚨 Alertes créées:', { count: alertsCount, ids: alertIds, details: alertDetails });
        
        const now = Date.now();
        const newAlertMessages: string[] = [];
        
        // Utiliser les détails des alertes si disponibles, sinon utiliser les IDs
        if (alertDetails.length > 0) {
          alertDetails.forEach((alert: any) => {
            // Éviter le spam : ne pas afficher la même alerte plus d'une fois toutes les 10 secondes
            const alertKey = `${alert.type}_${alert.severity}_${alert.id || Date.now()}`;
            const lastTime = lastAlertTime.current[alertKey] || 0;
            
            if (now - lastTime > 10000) { // 10 secondes entre les mêmes alertes
              const severityEmoji = alert.severity === 'high' || alert.severity === 'critical' ? '🔴' : 
                                    alert.severity === 'medium' ? '🟡' : '🟢';
              const alertMessage = `${severityEmoji} ${alert.description}`;
              newAlertMessages.push(alertMessage);
              lastAlertTime.current[alertKey] = now;
              console.log('📢 Alerte ajoutée à l\'interface:', alertMessage);
            }
          });
        } else if (alertIds.length > 0) {
          alertIds.forEach((alertId: number) => {
            const alertKey = `alert_${alertId}`;
            const lastTime = lastAlertTime.current[alertKey] || 0;
            
            if (now - lastTime > 10000) {
              newAlertMessages.push(`🚨 ALERTE: Nouvelle alerte de surveillance détectée (ID: ${alertId})`);
              lastAlertTime.current[alertKey] = now;
            }
          });
        }
        
        if (newAlertMessages.length > 0) {
          setAlerts((prev) => [...newAlertMessages, ...prev].slice(0, 50));
          console.log(`✅ ${newAlertMessages.length} alerte(s) affichée(s) dans l'interface`);
        }
      } else {
        // Log seulement si vraiment aucune alerte (pas de spam)
        if (alertsCount === 0) {
          console.log('ℹ️ Aucune alerte créée lors de cette analyse (tout est normal)');
        }
        
        // Afficher les informations de l'analyse même s'il n'y a pas d'alerte
        if (json.face_analysis) {
          const faceInfo = json.face_analysis;
          if (faceInfo.face_detected) {
            console.log('✅ Visage détecté - Confiance:', faceInfo.confidence?.toFixed(2), '- Luminosité:', faceInfo.low_light ? 'FAIBLE ⚠️' : 'NORMALE ✅');
          } else {
            console.log('⚠️ Aucun visage détecté');
          }
          if (faceInfo.multiple_faces) {
            console.log('⚠️ Plusieurs visages détectés');
          }
        }
        
        if (json.suspicious_objects && json.suspicious_objects.suspicious_objects_detected) {
          console.log('⚠️ Objets suspects détectés:', json.suspicious_objects.objects_found);
        }
      }

      // Appel séparé pour l'analyse du visage (cadre jaune de suivi)
      try {
        const faceRes = await fetch('http://localhost:8000/api/v1/surveillance/analyze-face', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify({
            image_data: dataUrl,
          }),
        });

        if (faceRes.ok) {
          const faceJson = await faceRes.json();
          console.log('👤 Analyse visage:', { 
            face_detected: faceJson.face_detected, 
            bbox: faceJson.bbox,
            low_light: faceJson.low_light,
            multiple_faces: faceJson.multiple_faces
          });
          
          if (faceJson.face_detected && faceJson.bbox && Array.isArray(faceJson.bbox) && faceJson.bbox.length >= 4) {
            const [x, y, width, height] = faceJson.bbox as [number, number, number, number];
            console.log('📦 Coordonnées visage brutes:', { x, y, width, height });
            
            // Ajuster les coordonnées selon la taille réelle de la vidéo affichée
            const video = videoRef.current;
            if (video && video.videoWidth && video.videoHeight) {
              const videoDisplayWidth = video.clientWidth;
              const videoDisplayHeight = video.clientHeight;
              const scaleX = videoDisplayWidth / video.videoWidth;
              const scaleY = videoDisplayHeight / video.videoHeight;
              
              const scaledBox = {
                x: x * scaleX, 
                y: y * scaleY, 
                width: width * scaleX, 
                height: height * scaleY 
              };
              
              console.log('📦 Coordonnées visage ajustées:', scaledBox);
              setFaceBox(scaledBox);
            } else {
              console.warn('⚠️ Dimensions vidéo non disponibles, utilisation des coordonnées brutes');
              setFaceBox({ x, y, width, height });
            }
          } else {
            console.log('❌ Pas de visage détecté ou bbox invalide');
            setFaceBox(null);
          }
        } else {
          const errorText = await faceRes.text().catch(() => 'Erreur inconnue');
          console.error('❌ Erreur analyse visage:', faceRes.status, errorText);
          setFaceBox(null);
        }
      } catch (error) {
        console.error('❌ Exception lors de l\'analyse du visage:', error);
        setFaceBox(null);
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement pour ne pas spammer la console
      console.log('Erreur analyse (ignorée):', error);
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
        
        // Vérifier le réseau en testant un endpoint qui existe
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const token = localStorage.getItem('pf_token') || localStorage.getItem('auth_token');
          
          // Tester avec l'endpoint auth/me qui existe toujours
          const response = await fetch('http://localhost:8000/api/v1/auth/me', {
            method: 'GET',
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          // Considérer comme OK si on obtient une réponse (même 401 = serveur accessible)
          setNetworkOk(response.status !== 0 && response.status < 500);
          console.log('Réseau auto-vérifié:', response.status !== 0 && response.status < 500);
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

    // Subscribe to student warnings from main process (alertes de processus interdits)
    const off = window.electronAPI?.onStudentWarning?.((payload: any) => {
      console.log('🔔 Alerte reçue du main process:', payload);
      const msg = payload?.message || 'Application non autorisée détectée';
      const appName = payload?.app || 'Application inconnue';
      
      // Message formaté pour l'affichage
      const alertMessage = `🚫 ${msg}`;
      
      // Liste des processus système à ignorer (même côté frontend pour éviter le spam)
      const systemProcessesToIgnore = [
        'trustedinstaller', 'tiworker', 'startmenuexperiencehost', 'runtimebroker',
        'dllhost', 'vmwp', 'vmmem', 'vmmemwsl', 'docker', 'dockerd', 'docker desktop',
        'nvsphelper64', 'nvidia', 'nvcontainer', 'nvidia overlay',
        'explorer', 'dwm', 'winlogon', 'csrss', 'services', 'lsass', 'svchost', 'system'
      ];
      
      const appNameLower = appName.toLowerCase().replace('.exe', '').trim();
      const isSystemProcess = systemProcessesToIgnore.some(sysProc => 
        appNameLower === sysProc || 
        appNameLower.includes(sysProc) || 
        sysProc.includes(appNameLower)
      );
      
      if (isSystemProcess) {
        console.log('⚙️ Processus système ignoré (frontend):', appName);
        return; // Ne pas afficher d'alerte pour les processus système
      }
      
      // Ajouter à la liste des alertes avec déduplication stricte
      const now = Date.now();
      const alertKey = `forbidden_app_${appName}`;
      const lastTime = lastAlertTime.current[alertKey] || 0;
      const DEDUP_INTERVAL = 60000; // 60 secondes entre les mêmes alertes (augmenté pour réduire le spam)
      
      if (now - lastTime > DEDUP_INTERVAL) {
        setAlerts((prev) => {
          // Limiter à 20 alertes max pour éviter la surcharge
          // Regrouper les alertes similaires
          const newAlerts = [alertMessage, ...prev].slice(0, 20);
          console.log('📋 Alertes mises à jour:', newAlerts.length, 'alertes');
          return newAlerts;
        });
        lastAlertTime.current[alertKey] = now;
        console.log('🚫 Alerte processus interdite ajoutée:', appName);
      } else {
        const timeRemaining = Math.ceil((DEDUP_INTERVAL - (now - lastTime)) / 1000);
        console.log(`⏭️ Alerte ignorée (déjà affichée il y a ${Math.ceil((now - lastTime) / 1000)}s, ${timeRemaining}s restants):`, appName);
      }
      
      // Popup in-app (non système) - Afficher seulement si pas déjà affichée récemment
      const toastKey = `toast_${appName}`;
      const lastToastTime = lastAlertTime.current[toastKey] || 0;
      const TOAST_DEDUP_INTERVAL = 30000; // 30 secondes entre les toasts pour la même app
      
      if (now - lastToastTime > TOAST_DEDUP_INTERVAL) {
        try {
          const container = document.getElementById('pf-toast-container') || (() => {
            const c = document.createElement('div');
            c.id = 'pf-toast-container';
            c.style.position = 'fixed';
            c.style.right = '16px';
            c.style.top = '16px';
            c.style.zIndex = '99999';
            c.style.maxWidth = '400px';
            document.body.appendChild(c);
            return c;
          })();
          
          // Limiter le nombre de toasts simultanés à 3
          const existingToasts = container.children.length;
          if (existingToasts >= 3) {
            // Supprimer le plus ancien
            if (container.firstChild) {
              container.removeChild(container.firstChild);
            }
          }
          
          const toast = document.createElement('div');
          toast.style.background = '#dc2626';
          toast.style.color = 'white';
          toast.style.padding = '12px 16px';
          toast.style.marginTop = '8px';
          toast.style.borderRadius = '8px';
          toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';
          toast.style.fontWeight = '500';
          toast.style.animation = 'slideIn 0.3s ease-out';
          toast.textContent = alertMessage;
          container.appendChild(toast);
          lastAlertTime.current[toastKey] = now;
          console.log('🔴 Toast affiché pour:', appName);
          
          setTimeout(() => { 
            if (container.contains(toast)) {
              toast.style.animation = 'slideOut 0.3s ease-out';
              setTimeout(() => {
                if (container.contains(toast)) {
                  container.removeChild(toast);
                }
              }, 300);
            }
          }, 4000); // Afficher pendant 4 secondes
        } catch (e) {
          console.error('❌ Erreur création toast:', e);
        }
      } else {
        console.log('⏭️ Toast ignoré (déjà affiché récemment):', appName);
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof off === 'function') off();
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 theme-dark:from-slate-900 theme-dark:via-slate-800 theme-dark:to-slate-700 text-gray-900 theme-dark:text-gray-100 space-y-6 p-4 sm:p-6 -m-4 sm:-m-6 lg:-m-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
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
                <Button
                  onClick={openExamPdf}
                  variant="secondary"
                  size="lg"
                  icon={FileText}
                  className="w-full h-12 rounded-xl text-lg font-semibold"
                >
                  Ouvrir le PDF de l&apos;examen
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
              {/* Cadre jaune de suivi du visage */}
              {running && faceBox && (
                <div
                  style={{
                    position: 'absolute',
                    border: '4px solid #eab308',
                    boxShadow: '0 0 0 2px rgba(250,204,21,0.6), 0 0 30px rgba(250,204,21,0.4)',
                    borderRadius: '12px',
                    left: `${faceBox.x}px`,
                    top: `${faceBox.y}px`,
                    width: `${faceBox.width}px`,
                    height: `${faceBox.height}px`,
                    pointerEvents: 'none',
                    transition: 'all 150ms ease-out',
                    zIndex: 10,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                >
                  {/* Indicateur visuel aux coins */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '-6px',
                      width: '20px',
                      height: '20px',
                      background: '#eab308',
                      borderRadius: '50%',
                      border: '3px solid #111827',
                      boxShadow: '0 0 10px rgba(250,204,21,0.8)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      background: '#eab308',
                      borderRadius: '50%',
                      border: '3px solid #111827',
                      boxShadow: '0 0 10px rgba(250,204,21,0.8)',
                    }}
                  />
                </div>
              )}
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


