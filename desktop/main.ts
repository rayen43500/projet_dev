// Imports Node.js pour le main process uniquement
const electron = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

// Destructuration des modules Electron
const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } = electron;
const { join } = path;
const { existsSync } = fs;

// S'assurer que __dirname est disponible
if (typeof __dirname === 'undefined') {
  global.__dirname = path.dirname(require.main?.filename || process.execPath);
}

// __dirname est automatiquement disponible en CommonJS

const execAsync = promisify(exec);

// Fonction pour vérifier si le serveur Vite est prêt
async function checkViteServer(): Promise<boolean> {
  try {
    console.log('Vérification du serveur Vite...');
    const response = await fetch('http://localhost:5173');
    console.log('Réponse du serveur Vite:', response.status, response.statusText);
    return response.ok;
  } catch (error) {
    console.log('Erreur lors de la vérification du serveur Vite:', error);
    return false;
  }
}

// Configuration de sécurité
app.on('web-contents-created', (_event: any, contents: any) => {
  // Bloquer la navigation vers des sites externes
  contents.on('will-navigate', (event: any, navigationUrl: string) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173') {
      event.preventDefault();
    }
  });

  // Bloquer l'ouverture de nouvelles fenêtres
  contents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Créer la fenêtre principale
let mainWindowRef: Electron.BrowserWindow | null = null;
let tray: Electron.Tray | null = null;

async function createWindow(): Promise<void> {
  // Build a safe icon if available
  let windowIcon: any = undefined;
  try {
    const possibleIconPath = join(__dirname, 'assets/icon.png');
    if (existsSync(possibleIconPath)) {
      windowIcon = nativeImage.createFromPath(possibleIconPath);
    }
  } catch {}

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: join(__dirname, 'preload.js'),
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableRemoteModule: false,
      sandbox: false
    },
  icon: windowIcon || undefined,
    titleBarStyle: 'hiddenInset',
    frame: false,
    autoHideMenuBar: true,
    show: false,
    transparent: false,
    backgroundColor: '#f8fafc'
  });

  // Charger l'application
  // Forcer le mode développement pour utiliser Vite
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('ELECTRON_IS_DEV:', process.env.ELECTRON_IS_DEV);
  
  // Toujours utiliser le mode développement pour le moment
  const isDevelopment = true; // process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    console.log('Mode développement détecté');
    
    // Attendre que le serveur Vite soit prêt
    const loadDevServer = async () => {
      try {
        // Vérifier si le serveur Vite est prêt
        const isViteReady = await checkViteServer();
        if (!isViteReady) {
          console.log('Serveur Vite pas encore prêt, nouvelle tentative dans 2 secondes...');
          setTimeout(loadDevServer, 2000);
          return;
        }
        
        console.log('Serveur Vite prêt, chargement de l\'URL...');
        await mainWindow.loadURL('http://localhost:5173');
        console.log('URL chargée avec succès');
        mainWindow.webContents.openDevTools();
        console.log('Outils de développement ouverts');
      } catch (error) {
        console.log('Erreur lors du chargement:', (error as Error).message);
        console.log('Nouvelle tentative dans 3 secondes...');
        setTimeout(loadDevServer, 3000);
      }
    };
    
    // Commencer à vérifier après 2 secondes
    setTimeout(loadDevServer, 2000);
  } else {
    console.log('Mode production détecté');
    mainWindow.loadFile(join(__dirname, 'renderer/index.html'));
  }

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    try { mainWindow.setMenuBarVisibility(false); } catch {}
    mainWindow.show();
    // Démarrer la surveillance des processus
    startProcessMonitor(mainWindow);
  });

  // Gérer la fermeture de la fenêtre
  mainWindow.on('close', (e: Electron.Event) => {
    // Si on a un tray, minimiser en zone de notification au lieu de quitter
    if (tray && !app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
      return;
    }
  });

  mainWindow.on('closed', () => {
    stopProcessMonitor();
    mainWindowRef = null;
  });

  mainWindowRef = mainWindow;

  // Créer le tray si pas déjà créé
  if (!tray) {
    try {
      const iconPath = join(__dirname, 'assets/icon.png');
      let trayIcon: Electron.NativeImage | string = '';
      if (existsSync(iconPath)) {
        trayIcon = nativeImage.createFromPath(iconPath);
      } else {
        // 1x1 transparent PNG
        const transparentPixel =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
        trayIcon = nativeImage.createFromDataURL(transparentPixel);
      }
      tray = new Tray(trayIcon);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Afficher',
          click: () => {
            if (mainWindowRef) {
              mainWindowRef.show();
              mainWindowRef.focus();
            }
          }
        },
        {
          label: 'Masquer',
          click: () => {
            if (mainWindowRef) mainWindowRef.hide();
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          click: () => {
            app.isQuiting = true as any;
            stopProcessMonitor();
            app.quit();
          }
        }
      ]);
  tray!.setToolTip('ProctoFlex AI');
  tray!.setContextMenu(contextMenu);
  tray!.on('double-click', () => {
        if (mainWindowRef) {
          mainWindowRef.show();
          mainWindowRef.focus();
        }
      });
    } catch (e) {
      console.error('Erreur création tray:', e);
    }
  }
}

// Gestionnaires IPC pour la communication avec le renderer
let studentIdentity: any = null;

ipcMain.handle('close-window', () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('minimize-window', () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('hide-window', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindowRef;
  if (win) win.hide();
});

ipcMain.handle('show-window', () => {
  const win = mainWindowRef;
  if (win) {
    win.show();
    win.focus();
  }
});

ipcMain.handle('set-student-identity', (_event: any, identity: any) => {
  try {
    studentIdentity = identity || null;
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('get-running-processes', async () => {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync('Get-Process | Select-Object ProcessName, Id, CPU | ConvertTo-Json', { shell: 'PowerShell' });
      return JSON.parse(stdout);
    } else {
      const { stdout } = await execAsync('ps -eo comm,pid,%cpu --no-headers | awk \'{print "{\\"ProcessName\\":\\"" $1 "\\",\\"Id\\":" $2 ",\\"CPU\\":" $3 "}"}\' | jq -s .');
      return JSON.parse(stdout);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des processus:', error);
    return [];
  }
});

ipcMain.handle('capture-screen', async () => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow) {
      const image = await mainWindow.webContents.capturePage();
      return image.toDataURL();
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la capture d\'écran:', error);
    return null;
  }
});

ipcMain.handle('log-security-alert', async (_event: any, alertData: any) => {
  try {
    console.log('Alerte de sécurité:', alertData);
    // Envoi côté serveur avec identité si disponible
    await sendAlert({ ...alertData });
    return true;
  } catch (error) {
    console.error('Erreur lors de la journalisation:', error);
    return false;
  }
});

// --- Process Monitor (polling) ---
let monitorInterval: NodeJS.Timeout | null = null;
let lastLockConfig: any = {
  allowed_apps: ["code.exe","excel.exe","python.exe"],
  forbidden_apps: ["discord.exe","whatsapp.exe","teams.exe","chrome.exe"],
  policy: { auto_kill: false, repeat_threshold: 2 }
};

async function fetchLockConfig() {
  try {
    const res = await fetch('http://localhost:8000/api/v1/config/lock');
    if (!res.ok) return null;
    const json = await res.json();
    lastLockConfig = json || lastLockConfig;
    return json;
  } catch (e) {
    console.error('Erreur fetch lock config:', e);
    return null;
  }
}

async function listProcessesLower(): Promise<string> {
  try {
    if (process.platform === 'win32') {
      // Format CSV for parsing stable process names
      const { stdout } = await execAsync('tasklist /FO CSV /NH');
      // stdout lines like: "chrome.exe","1234","Console","1","120,000 K"
      const names = stdout
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0)
        .map((l: string) => {
          const m = l.match(/^"([^"]+)"/);
          return m ? m[1].toLowerCase() : '';
        })
        .filter(Boolean);
      return names.join('\n');
    }
    const { stdout } = await execAsync('ps -A -o comm');
    return stdout.toLowerCase();
  } catch (e) {
    console.error('Erreur listProcessesLower:', e);
    return '';
  }
}

// Renvoie un Set des noms de processus (lowercase)
async function listProcessNamesSet(): Promise<Set<string>> {
  const set = new Set<string>();
  const raw = await listProcessesLower();
  if (!raw) return set;
  for (const line of raw.split('\n')) {
    const name = line.trim();
    if (!name) continue;
    const base = name.includes('/') ? (name.split('/').pop() || name) : name;
    set.add(base.toLowerCase());
  }
  return set;
}

async function sendAlert(alert: any) {
  try {
    await fetch('http://localhost:8000/api/v1/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...alert,
        timestamp: new Date().toISOString(),
        student: studentIdentity || undefined
      })
    });
  } catch (e) {
    console.error('Erreur envoi alerte:', e);
  }
}

// Compteurs pour appliquer repeat_threshold avant kill
const forbiddenCounters: Record<string, number> = {};
const lastNotifyAt: Record<string, number> = {};

async function killProcessWindows(procNameLower: string) {
  try {
    await execAsync(`taskkill /IM ${procNameLower} /F`);
  } catch {}
}

async function tickProcessMonitor(mainWindow: Electron.BrowserWindow | null) {
  const cfg = await fetchLockConfig();
  const effective = cfg || lastLockConfig;
  // allowed list currently unused in enforcement; only forbidden list is checked
  const forbidden: string[] = (effective.forbidden_apps || []).map((s: string) => s.toLowerCase());
  const autoKill: boolean = !!(effective.policy && effective.policy.auto_kill);
  const repeatThreshold: number = Math.max(1, Number(effective.policy?.repeat_threshold || 2));

  const procSet = await listProcessNamesSet();
  if (!procSet.size) return;

  for (const forb of forbidden) {
    if (forb && procSet.has(forb)) {
      console.log('[Monitor] Application interdite détectée:', forb);
      await sendAlert({ type: 'forbidden_app', process: forb });
      const now = Date.now();
      if (!lastNotifyAt[forb] || now - lastNotifyAt[forb] > 10000) {
        lastNotifyAt[forb] = now;
        if (mainWindow) {
          mainWindow.webContents.send('student-warning', { app: forb, message: `⚠️ L'application "${forb}" est interdite pendant l'examen.` });
        }
      }
      if (autoKill && process.platform === 'win32') {
        forbiddenCounters[forb] = (forbiddenCounters[forb] || 0) + 1;
        if (forbiddenCounters[forb] >= repeatThreshold) {
          await killProcessWindows(forb);
          forbiddenCounters[forb] = 0;
        }
      }
    }
  }
}

function startProcessMonitor(mainWindow: Electron.BrowserWindow) {
  if (monitorInterval) return;
  monitorInterval = setInterval(() => {
    tickProcessMonitor(mainWindow);
  }, 4000); // toutes les 4s
}

function stopProcessMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

// Gestionnaires d'événements de l'application
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Erreur non capturée:', error);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Promesse rejetée non gérée:', reason);
});
