import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Variables globales
let mainWindow: BrowserWindow | null = null;
let isDev = process.env.NODE_ENV === 'development';

// Configuration de sécurité
const SECURITY_CONFIG = {
  webSecurity: true,
  allowRunningInsecureContent: false,
  experimentalFeatures: false,
  nodeIntegration: false,
  contextIsolation: true,
  enableRemoteModule: false,
  sandbox: true
};

// Configuration de la fenêtre principale
const WINDOW_CONFIG = {
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  show: false,
  webPreferences: {
    ...SECURITY_CONFIG,
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,
    allowRunningInsecureContent: false
  }
};

// Création de la fenêtre principale
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    title: 'ProctoFlex AI - Surveillance d\'Examen',
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  // Chargement de l'application
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Gestion des événements de la fenêtre
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Sécurité : empêcher l'ouverture de liens externes
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Gestion du cycle de vie de l'application
app.whenReady().then(() => {
  // Configuration de la session pour la sécurité
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    // Bloquer les requêtes non sécurisées
    if (details.url.startsWith('http://') && !isDev) {
      callback({ cancel: true });
    } else {
      callback({});
    }
  });

  // Création de la fenêtre principale
  createMainWindow();

  // Gestion de l'activation sur macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Fermeture de l'application
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gestion des événements IPC
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// Gestion des processus système
ipcMain.handle('get-running-processes', async () => {
  try {
    // Utilisation de PowerShell sur Windows pour lister les processus
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('Get-Process | Select-Object ProcessName, Id, CPU | ConvertTo-Json', 
          { shell: 'powershell.exe' }, (error: any, stdout: string) => {
          if (error) {
            reject(error);
          } else {
            try {
              const processes = JSON.parse(stdout);
              resolve(processes);
            } catch (e) {
              resolve([]);
            }
          }
        });
      });
    } else {
      // Sur macOS/Linux, utiliser ps
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('ps -eo comm,pid,%cpu --no-headers', (error: any, stdout: string) => {
          if (error) {
            reject(error);
          } else {
            const processes = stdout.trim().split('\n').map(line => {
              const [comm, pid, cpu] = line.trim().split(/\s+/);
              return { ProcessName: comm, Id: parseInt(pid), CPU: parseFloat(cpu) };
            });
            resolve(processes);
          }
        });
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des processus:', error);
    return [];
  }
});

// Gestion des permissions système
ipcMain.handle('request-permissions', async () => {
  try {
    // Demander les permissions pour la webcam et le microphone
    const permissions = await mainWindow?.webContents.session.getUserMedia({
      audio: true,
      video: true
    });
    
    return {
      audio: true,
      video: true,
      granted: true
    };
  } catch (error) {
    console.error('Erreur lors de la demande de permissions:', error);
    return {
      audio: false,
      video: false,
      granted: false,
      error: error.message
    };
  }
});

// Gestion des captures d'écran
ipcMain.handle('capture-screen', async () => {
  try {
    if (!mainWindow) {
      throw new Error('Fenêtre principale non disponible');
    }

    const image = await mainWindow.webContents.capturePage();
    const buffer = image.toPNG();
    
    // Sauvegarder temporairement
    const tempPath = path.join(app.getPath('temp'), `screen_${Date.now()}.png`);
    fs.writeFileSync(tempPath, buffer);
    
    return {
      success: true,
      path: tempPath,
      size: buffer.length
    };
  } catch (error) {
    console.error('Erreur lors de la capture d\'écran:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Gestion des alertes de sécurité
ipcMain.handle('log-security-alert', async (event, alertData) => {
  try {
    const logPath = path.join(app.getPath('userData'), 'security_logs.json');
    let logs = [];
    
    // Lire les logs existants
    if (fs.existsSync(logPath)) {
      const data = fs.readFileSync(logPath, 'utf8');
      logs = JSON.parse(data);
    }
    
    // Ajouter la nouvelle alerte
    logs.push({
      ...alertData,
      timestamp: new Date().toISOString(),
      processId: process.pid
    });
    
    // Sauvegarder
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'alerte:', error);
    return { success: false, error: error.message };
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Erreur non capturée:', error);
  // Enregistrer l'erreur et redémarrer l'application si nécessaire
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
});
