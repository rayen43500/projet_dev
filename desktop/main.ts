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
  forbidden_apps: ["discord.exe","whatsapp.exe","teams.exe","chrome.exe","cursor.exe","msedge.exe","firefox.exe","opera.exe"],
  policy: { auto_kill: false, repeat_threshold: 2 }
};

async function fetchLockConfig() {
  try {
    // Récupérer la config de base (sans authentification requise)
    const res = await fetch('http://localhost:8000/api/v1/config/lock');
    if (!res.ok) {
      console.log('[Monitor] Config non disponible, utilisation de la config par défaut');
      return null;
    }
    const json = await res.json();
    
    // Merger avec la config par défaut pour s'assurer que forbidden_apps est toujours défini
    const mergedConfig = {
      ...lastLockConfig,
      ...json,
      forbidden_apps: json.forbidden_apps || lastLockConfig.forbidden_apps,
      allowed_apps: json.allowed_apps || lastLockConfig.allowed_apps,
      policy: json.policy || lastLockConfig.policy
    };
    
    lastLockConfig = mergedConfig;
    console.log('[Monitor] Config chargée:', { 
      forbidden_apps: mergedConfig.forbidden_apps?.length || 0,
      allowed_apps: mergedConfig.allowed_apps?.length || 0
    });
    return mergedConfig;
  } catch (e) {
    console.error('[Monitor] Erreur fetch lock config:', e);
    return null;
  }
}

// Fonction pour récupérer les applications autorisées depuis l'examen actif
async function fetchExamAllowedApps(examId: number | null, token?: string | null): Promise<string[] | null> {
  if (!examId) return null;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`http://localhost:8000/api/v1/exams/${examId}`, { headers });
    if (!res.ok) return null;
    const exam = await res.json();
    if (exam.allowed_apps) {
      try {
        const parsed = JSON.parse(exam.allowed_apps);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        // Si ce n'est pas du JSON, essayer de parser comme une liste séparée par des virgules
        const apps = exam.allowed_apps.split(',').map((s: string) => s.trim()).filter(Boolean);
        return apps.length > 0 ? apps : null;
      }
    }
    return null;
  } catch (e) {
    console.error('Erreur fetch exam allowed apps:', e);
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

async function sendAlert(alert: any, mainWindow?: Electron.BrowserWindow | null) {
  try {
    // Récupérer session_id, exam_id, student_id et token depuis le renderer
    let sessionId: number | null = null;
    let examId: number | null = null;
    let studentId: number | null = null;
    let token: string | null = null;
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        const [sessionIdStr, examIdStr, studentIdStr, tokenStr] = await Promise.all([
          mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pf_session_id")').catch(() => null),
          mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pf_exam_id")').catch(() => null),
          mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pf_student_id") || localStorage.getItem("pf_student_id")').catch(() => null),
          mainWindow.webContents.executeJavaScript('localStorage.getItem("pf_token") || localStorage.getItem("auth_token")').catch(() => null)
        ]);
        
        if (sessionIdStr) sessionId = parseInt(sessionIdStr);
        if (examIdStr) examId = parseInt(examIdStr);
        if (studentIdStr) studentId = parseInt(studentIdStr);
        if (tokenStr) token = tokenStr;
      } catch (e) {
        console.log('Erreur récupération contexte:', e);
      }
    }
    
    // Construire la description complète
    let description = alert.description || `Application interdite détectée`;
    if (alert.process) {
      description = `🚫 Application interdite détectée: ${alert.process}`;
    }
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('http://localhost:8000/api/v1/alerts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: alert.type || 'forbidden_app',
        severity: alert.severity || 'high',
        description: description,
        session_id: sessionId || alert.session_id || null,
        exam_id: examId || alert.exam_id || null,
        student_id: studentId || alert.student_id || null,
        process: alert.process || null
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[Monitor] ✅ Alerte envoyée avec succès:', { 
        type: alert.type, 
        process: alert.process, 
        sessionId, 
        examId,
        alertId: result.id 
      });
    } else {
      const errorText = await response.text();
      console.error('[Monitor] ❌ Erreur envoi alerte:', response.status, errorText);
    }
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
  
  // Récupérer l'examen actif depuis sessionStorage (via IPC si possible)
  let allowedApps: string[] | null = null;
  try {
    // Essayer de récupérer l'examen ID et le token depuis le renderer via executeJavaScript
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [examIdStr, token] = await Promise.all([
        mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pf_exam_id")').catch(() => null),
        mainWindow.webContents.executeJavaScript('localStorage.getItem("pf_token") || localStorage.getItem("auth_token")').catch(() => null)
      ]);
      
      if (examIdStr) {
        const examId = parseInt(examIdStr);
        if (!isNaN(examId)) {
          allowedApps = await fetchExamAllowedApps(examId, token || undefined);
          console.log('[Monitor] Examen actif trouvé:', examId, 'Apps autorisées:', allowedApps?.length || 0);
        }
      } else {
        console.log('[Monitor] Aucun examen actif - utilisation de la liste noire par défaut');
      }
    }
  } catch (e) {
    console.log('[Monitor] Impossible de récupérer l\'examen actif:', e);
  }
  
  // Si on a une liste d'applications autorisées, bloquer tout le reste
  // Sinon, utiliser la liste des applications interdites
  const procSet = await listProcessNamesSet();
  if (!procSet.size) {
    console.log('[Monitor] Aucun processus détecté');
    return;
  }
  
  console.log('[Monitor] Surveillance active -', procSet.size, 'processus détectés');
  
  if (allowedApps && allowedApps.length > 0) {
    // Mode liste blanche : bloquer tout sauf les applications autorisées
    const allowedLower = allowedApps.map((s: string) => s.toLowerCase().replace('.exe', ''));
    const systemProcesses = ['explorer', 'dwm', 'winlogon', 'csrss', 'services', 'lsass', 'svchost', 'system', 'idle'];
    
    for (const procName of procSet) {
      const procBase = procName.replace('.exe', '');
      // Ignorer les processus système
      if (systemProcesses.includes(procBase)) continue;
      
      // Vérifier si le processus est autorisé
      const isAllowed = allowedLower.some((allowed: string) => 
        procBase === allowed || procBase.includes(allowed) || allowed.includes(procBase)
      );
      
      if (!isAllowed) {
        console.log('[Monitor] Application non autorisée détectée:', procName);
        await sendAlert({ type: 'forbidden_app', process: procName, severity: 'high' }, mainWindow);
        const now = Date.now();
        if (!lastNotifyAt[procName] || now - lastNotifyAt[procName] > 10000) {
          lastNotifyAt[procName] = now;
          if (mainWindow) {
            mainWindow.webContents.send('student-warning', { 
              app: procName, 
              message: `⚠️ L'application "${procName}" n'est pas autorisée pendant l'examen.` 
            });
          }
        }
        const autoKill = !!(effective.policy && effective.policy.auto_kill);
        const repeatThreshold = Math.max(1, Number(effective.policy?.repeat_threshold || 2));
        if (autoKill && process.platform === 'win32') {
          forbiddenCounters[procName] = (forbiddenCounters[procName] || 0) + 1;
          if (forbiddenCounters[procName] >= repeatThreshold) {
            await killProcessWindows(procName);
            forbiddenCounters[procName] = 0;
          }
        }
      }
    }
  } else {
    // Mode liste noire : utiliser la liste des applications interdites
    const forbidden: string[] = (effective.forbidden_apps || []).map((s: string) => s.toLowerCase());
    const autoKill: boolean = !!(effective.policy && effective.policy.auto_kill);
    const repeatThreshold: number = Math.max(1, Number(effective.policy?.repeat_threshold || 2));

    // Log pour debug
    if (procSet.size > 0) {
      const sampleProcesses = Array.from(procSet).slice(0, 10);
      console.log('[Monitor] Processus détectés (échantillon):', sampleProcesses);
      console.log('[Monitor] Liste interdite:', forbidden);
    }

    for (const forb of forbidden) {
      // Vérifier avec et sans .exe
      const forbWithExe = forb.endsWith('.exe') ? forb : `${forb}.exe`;
      const forbWithoutExe = forb.endsWith('.exe') ? forb.replace('.exe', '') : forb;
      
      // Vérifier les deux variantes
      const isForbidden = procSet.has(forb) || procSet.has(forbWithExe) || procSet.has(forbWithoutExe);
      
      if (isForbidden) {
        // Trouver le nom exact du processus détecté
        const detectedName = Array.from(procSet).find(p => 
          p === forb || p === forbWithExe || p === forbWithoutExe ||
          p.includes(forbWithoutExe) || forbWithoutExe.includes(p.replace('.exe', ''))
        ) || forb;
        
        console.log('[Monitor] 🚫 Application interdite détectée:', detectedName, '(recherché:', forb, ')');
        await sendAlert({ type: 'forbidden_app', process: detectedName, severity: 'high' }, mainWindow);
        const now = Date.now();
        if (!lastNotifyAt[detectedName] || now - lastNotifyAt[detectedName] > 10000) {
          lastNotifyAt[detectedName] = now;
          if (mainWindow) {
            mainWindow.webContents.send('student-warning', { app: detectedName, message: `⚠️ L'application "${detectedName}" est interdite pendant l'examen.` });
          }
        }
        if (autoKill && process.platform === 'win32') {
          forbiddenCounters[detectedName] = (forbiddenCounters[detectedName] || 0) + 1;
          if (forbiddenCounters[detectedName] >= repeatThreshold) {
            await killProcessWindows(detectedName);
            forbiddenCounters[detectedName] = 0;
          }
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
