const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Récupérer les processus en cours
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),
  
  // Capturer l'écran
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  
  // Journaliser les alertes de sécurité
  logSecurityAlert: (alertData) => ipcRenderer.invoke('log-security-alert', alertData),

  // Définir l'identité de l'étudiant (pour associer les alertes)
  setStudentIdentity: (identity) => ipcRenderer.invoke('set-student-identity', identity),

  // S'abonner aux avertissements étudiant
  onStudentWarning: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('student-warning', listener);
    return () => ipcRenderer.removeListener('student-warning', listener);
  },

  // Contrôles de fenêtre
  closeWindow: () => ipcRenderer.invoke('close-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  
  // Vérifier si l'API est disponible
  isAvailable: true
});

// Gestion des erreurs
window.addEventListener('error', (event) => {
  console.error('Erreur dans le renderer:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesse rejetée dans le renderer:', event.reason);
});
