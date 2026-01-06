/**
 * Service d'enregistrement multimédia
 * ProctoFlex AI - Université de Monastir - ESPRIM
 */

import { ipcRenderer } from 'electron';

export interface RecordingConfig {
  video: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    fps: number;
    resolution: {
      width: number;
      height: number;
    };
  };
  audio: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    sampleRate: number;
    channels: number;
  };
  screen: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    fps: number;
    captureCursor: boolean;
  };
}

export interface RecordingSession {
  id: string;
  examId: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  status: 'recording' | 'paused' | 'stopped' | 'uploading' | 'completed';
  files: {
    video?: string;
    audio?: string;
    screen?: string[];
  };
  metadata: {
    duration: number;
    fileSize: number;
    quality: string;
  };
}

export interface RecordingStats {
  duration: number;
  fileSize: number;
  fps: number;
  bitrate: number;
  quality: number;
}

class MediaRecordingService {
  private isRecording = false;
  private currentSession: RecordingSession | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private videoStream: MediaStream | null = null;
  private audioStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private recordingChunks: Blob[] = [];
  private config: RecordingConfig;
  private recordingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Obtient la configuration par défaut
   */
  private getDefaultConfig(): RecordingConfig {
    return {
      video: {
        enabled: true,
        quality: 'medium',
        fps: 30,
        resolution: { width: 1280, height: 720 }
      },
      audio: {
        enabled: true,
        quality: 'medium',
        sampleRate: 44100,
        channels: 2
      },
      screen: {
        enabled: true,
        quality: 'medium',
        fps: 15,
        captureCursor: true
      }
    };
  }

  /**
   * Initialise le service d'enregistrement
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎥 Initialisation du service d\'enregistrement multimédia');
      
      // Vérifier les permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error('Permissions d\'enregistrement refusées');
      }

      console.log('✅ Service d\'enregistrement initialisé');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  /**
   * Vérifie les permissions d'enregistrement
   */
  private async checkPermissions(): Promise<boolean> {
    try {
      // Vérifier la caméra
      if (this.config.video.enabled) {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: this.config.video.resolution.width,
            height: this.config.video.resolution.height,
            frameRate: this.config.video.fps
          }
        });
        videoStream.getTracks().forEach(track => track.stop());
      }

      // Vérifier le microphone
      if (this.config.audio.enabled) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: this.config.audio.sampleRate,
            channelCount: this.config.audio.channels
          }
        });
        audioStream.getTracks().forEach(track => track.stop());
      }

      // Vérifier l'écran (simulation)
      if (this.config.screen.enabled) {
        // En production, utiliser getDisplayMedia
        console.log('📺 Permissions d\'écran vérifiées (simulation)');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Démarre une session d'enregistrement
   */
  async startRecording(examId: string, studentId: string): Promise<RecordingSession> {
    try {
      if (this.isRecording) {
        throw new Error('Un enregistrement est déjà en cours');
      }

      console.log(`🎬 Démarrage de l'enregistrement pour l'examen ${examId}`);

      // Créer la session
      this.currentSession = {
        id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        examId,
        studentId,
        startTime: new Date(),
        status: 'recording',
        files: {},
        metadata: {
          duration: 0,
          fileSize: 0,
          quality: this.config.video.quality
        }
      };

      // Démarrer les streams
      await this.startMediaStreams();

      // Démarrer l'enregistrement
      await this.startMediaRecorder();

      this.isRecording = true;

      // Démarrer la surveillance des statistiques
      this.startStatsMonitoring();

      console.log(`✅ Enregistrement démarré: ${this.currentSession.id}`);
      return this.currentSession;

    } catch (error) {
      console.error('❌ Erreur lors du démarrage de l\'enregistrement:', error);
      throw error;
    }
  }

  /**
   * Démarre les streams média
   */
  private async startMediaStreams(): Promise<void> {
    try {
      // Stream vidéo
      if (this.config.video.enabled) {
        this.videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: this.config.video.resolution.width,
            height: this.config.video.resolution.height,
            frameRate: this.config.video.fps
          }
        });
        console.log('📹 Stream vidéo démarré');
      }

      // Stream audio
      if (this.config.audio.enabled) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: this.config.audio.sampleRate,
            channelCount: this.config.audio.channels
          }
        });
        console.log('🎤 Stream audio démarré');
      }

      // Stream écran (simulation)
      if (this.config.screen.enabled) {
        // En production, utiliser getDisplayMedia
        console.log('📺 Stream écran démarré (simulation)');
      }

    } catch (error) {
      console.error('❌ Erreur lors du démarrage des streams:', error);
      throw error;
    }
  }

  /**
   * Démarre l'enregistreur média
   */
  private async startMediaRecorder(): Promise<void> {
    try {
      // Combiner les streams
      const combinedStream = new MediaStream();
      
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => combinedStream.addTrack(track));
      }
      
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => combinedStream.addTrack(track));
      }

      // Configurer l'enregistreur
      const mimeType = this.getSupportedMimeType();
      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: this.getVideoBitrate(),
        audioBitsPerSecond: this.getAudioBitrate()
      };

      this.mediaRecorder = new MediaRecorder(combinedStream, options);
      this.recordingChunks = [];

      // Gérer les événements
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ Erreur de l\'enregistreur:', event);
      };

      // Démarrer l'enregistrement
      this.mediaRecorder.start(1000); // Chunk toutes les secondes
      console.log('🎬 Enregistreur média démarré');

    } catch (error) {
      console.error('❌ Erreur lors du démarrage de l\'enregistreur:', error);
      throw error;
    }
  }

  /**
   * Obtient le type MIME supporté
   */
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm'; // Fallback
  }

  /**
   * Calcule le bitrate vidéo
   */
  private getVideoBitrate(): number {
    const qualityMap = {
      low: 500000,    // 500 kbps
      medium: 1000000, // 1 Mbps
      high: 2000000   // 2 Mbps
    };
    return qualityMap[this.config.video.quality];
  }

  /**
   * Calcule le bitrate audio
   */
  private getAudioBitrate(): number {
    const qualityMap = {
      low: 64000,     // 64 kbps
      medium: 128000, // 128 kbps
      high: 256000    // 256 kbps
    };
    return qualityMap[this.config.audio.quality];
  }

  /**
   * Met en pause l'enregistrement
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        throw new Error('Aucun enregistrement en cours');
      }

      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
        if (this.currentSession) {
          this.currentSession.status = 'paused';
        }
        console.log('⏸️ Enregistrement mis en pause');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la pause:', error);
    }
  }

  /**
   * Reprend l'enregistrement
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        throw new Error('Aucun enregistrement en cours');
      }

      if (this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
        if (this.currentSession) {
          this.currentSession.status = 'recording';
        }
        console.log('▶️ Enregistrement repris');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la reprise:', error);
    }
  }

  /**
   * Arrête l'enregistrement
   */
  async stopRecording(): Promise<RecordingSession | null> {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        throw new Error('Aucun enregistrement en cours');
      }

      console.log('🛑 Arrêt de l\'enregistrement');

      // Arrêter l'enregistreur
      if (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.stop();
      }

      // Arrêter les streams
      this.stopMediaStreams();

      // Arrêter la surveillance
      this.stopStatsMonitoring();

      this.isRecording = false;

      if (this.currentSession) {
        this.currentSession.status = 'stopped';
        this.currentSession.endTime = new Date();
        this.currentSession.metadata.duration = 
          this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
      }

      console.log('✅ Enregistrement arrêté');
      return this.currentSession;

    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt:', error);
      return null;
    }
  }

  /**
   * Arrête les streams média
   */
  private stopMediaStreams(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    console.log('📹 Streams média arrêtés');
  }

  /**
   * Gère l'arrêt de l'enregistrement
   */
  private handleRecordingStop(): void {
    try {
      if (this.recordingChunks.length === 0) {
        console.warn('⚠️ Aucune donnée enregistrée');
        return;
      }

      // Créer le blob final
      const blob = new Blob(this.recordingChunks, { type: this.getSupportedMimeType() });
      
      // Sauvegarder le fichier
      this.saveRecordingFile(blob);

      console.log('💾 Fichier d\'enregistrement sauvegardé');

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Sauvegarde le fichier d'enregistrement
   */
  private async saveRecordingFile(blob: Blob): Promise<void> {
    try {
      if (!this.currentSession) return;

      // Convertir en base64 pour l'envoi
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Envoyer au processus principal pour sauvegarde
      const filePath = await ipcRenderer.invoke('save-recording-file', {
        sessionId: this.currentSession.id,
        examId: this.currentSession.examId,
        data: base64,
        mimeType: blob.type
      });

      // Mettre à jour la session
      if (this.currentSession) {
        this.currentSession.files.video = filePath;
        this.currentSession.metadata.fileSize = blob.size;
        this.currentSession.status = 'uploading';
      }

      console.log(`💾 Fichier sauvegardé: ${filePath}`);

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du fichier:', error);
    }
  }

  /**
   * Démarre la surveillance des statistiques
   */
  private startStatsMonitoring(): void {
    this.recordingInterval = setInterval(() => {
      this.updateRecordingStats();
    }, 1000); // Mise à jour chaque seconde
  }

  /**
   * Arrête la surveillance des statistiques
   */
  private stopStatsMonitoring(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  /**
   * Met à jour les statistiques d'enregistrement
   */
  private updateRecordingStats(): void {
    if (!this.currentSession) return;

    const now = new Date();
    this.currentSession.metadata.duration = now.getTime() - this.currentSession.startTime.getTime();
  }

  /**
   * Obtient les statistiques actuelles
   */
  getRecordingStats(): RecordingStats | null {
    if (!this.currentSession) return null;

    const duration = this.currentSession.metadata.duration / 1000; // en secondes
    const fileSize = this.currentSession.metadata.fileSize;
    const fps = this.config.video.fps;
    const bitrate = this.getVideoBitrate() + this.getAudioBitrate();
    const quality = this.getQualityScore();

    return {
      duration,
      fileSize,
      fps,
      bitrate,
      quality
    };
  }

  /**
   * Calcule le score de qualité
   */
  private getQualityScore(): number {
    const qualityMap = {
      low: 0.6,
      medium: 0.8,
      high: 1.0
    };
    return qualityMap[this.config.video.quality];
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<RecordingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuration d\'enregistrement mise à jour');
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): RecordingConfig {
    return { ...this.config };
  }

  /**
   * Obtient la session actuelle
   */
  getCurrentSession(): RecordingSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Vérifie si l'enregistrement est actif
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Nettoie les ressources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      this.stopMediaStreams();
      this.stopStatsMonitoring();
      this.currentSession = null;
      this.recordingChunks = [];

      console.log('✅ Service d\'enregistrement nettoyé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }
}

// Instance globale du service
export const mediaRecordingService = new MediaRecordingService();

// Export des types
export type {
  RecordingConfig,
  RecordingSession,
  RecordingStats
};
