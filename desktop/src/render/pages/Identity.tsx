import React, { useRef, useState } from 'react';

export default function Identity(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<string>('');

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('🎥 Caméra démarrée');
    } catch (e: any) {
      setStatus(`❌ Caméra indisponible: ${e.message}`);
    }
  }

  async function verify() {
    try {
      setStatus('Vérification en cours...');
      const canvas = document.createElement('canvas');
      const video = videoRef.current!;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      const res = await fetch('http://localhost:8000/api/v1/ai/verify_identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ face_image_base64: base64, id_image_base64: base64 }),
      });
      const json = await res.json();
      setStatus(json.verified ? '✅ Identité vérifiée' : '❌ Échec vérification');
    } catch (e: any) {
      setStatus(`❌ Erreur: ${e.message}`);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Vérification d’identité</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <video ref={videoRef} style={{ width: 360, background: '#111827', borderRadius: 8 }} />
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={startCamera} style={{ padding: '10px 12px', borderRadius: 6, background: '#2563eb', color: 'white', border: 0 }}>Démarrer caméra</button>
          <button onClick={verify} style={{ padding: '10px 12px', borderRadius: 6, background: '#10b981', color: 'white', border: 0 }}>Vérifier</button>
          <div>{status}</div>
        </div>
      </div>
    </div>
  );
}


