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
    let retryCount = 0;
    const maxRetries = 10; // Maximum 10 tentatives (20 secondes)
    
    const loadDevServer = async () => {
      try {
        // Vérifier si le serveur Vite est prêt
        const isViteReady = await checkViteServer();
        if (!isViteReady) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Serveur Vite pas encore prêt (tentative ${retryCount}/${maxRetries}), nouvelle tentative dans 2 secondes...`);
            setTimeout(loadDevServer, 2000);
            return;
          } else {
            console.error('❌ Serveur Vite non disponible après plusieurs tentatives');
            // Afficher quand même la fenêtre avec un message d'erreur
            mainWindow.show();
            mainWindow.webContents.loadURL('data:text/html,<h1>Serveur Vite non disponible</h1><p>Veuillez démarrer le serveur de développement avec: npm run dev:renderer</p>');
            return;
          }
        }
        
        console.log('✅ Serveur Vite prêt, chargement de l\'URL...');
        await mainWindow.loadURL('http://localhost:5173');
        console.log('✅ URL chargée avec succès');
        mainWindow.webContents.openDevTools();
        console.log('✅ Outils de développement ouverts');
      } catch (error) {
        console.error('❌ Erreur lors du chargement:', (error as Error).message);
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Nouvelle tentative dans 3 secondes... (${retryCount}/${maxRetries})`);
          setTimeout(loadDevServer, 3000);
        } else {
          console.error('❌ Impossible de charger l\'application après plusieurs tentatives');
          // Afficher quand même la fenêtre
          mainWindow.show();
          mainWindow.webContents.loadURL('data:text/html,<h1>Erreur de chargement</h1><p>Impossible de se connecter au serveur Vite. Vérifiez que le serveur est démarré.</p>');
        }
      }
    };
    
    // Commencer à vérifier après 1 seconde
    setTimeout(loadDevServer, 1000);
  } else {
    console.log('Mode production détecté');
    mainWindow.loadFile(join(__dirname, 'renderer/index.html'));
  }

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    try { mainWindow.setMenuBarVisibility(false); } catch {}
    console.log('✅ Fenêtre prête à être affichée');
    mainWindow.show();
    // Démarrer la surveillance des processus avec un petit délai pour s'assurer que la fenêtre est prête
    setTimeout(() => {
      console.log('[Monitor] 🚀 Initialisation du monitoring depuis ready-to-show...');
      startProcessMonitor(mainWindow);
    }, 1000);
  });

  // Fallback : afficher la fenêtre après un délai même si ready-to-show n'est pas appelé
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.log('⚠️ Fenêtre non visible après 5 secondes, affichage forcé...');
      try {
        mainWindow.show();
        mainWindow.setMenuBarVisibility(false);
      } catch (e) {
        console.error('Erreur lors de l\'affichage forcé:', e);
      }
    }
  }, 5000);

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

  // Gérer les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Erreur de chargement:', errorCode, errorDescription, validatedURL);
    // Afficher quand même la fenêtre pour voir l'erreur
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('❌ Le processus de rendu a planté');
  });

  mainWindowRef = mainWindow;
  
  // S'assurer que le monitoring démarre même si ready-to-show n'est pas appelé
  // (fallback pour certains cas)
  setTimeout(() => {
    if (mainWindowRef && !monitorInterval) {
      console.log('[Monitor] 🚀 Démarrage du monitoring (fallback après 3s)...');
      startProcessMonitor(mainWindowRef);
    }
  }, 3000);

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

async function fetchLockConfig(): Promise<any> {
  try {
    // Récupérer la config de base (sans authentification requise)
    const res = await fetch('http://localhost:8000/api/v1/config/lock');
    if (!res.ok) {
      console.log('[Monitor] Config non disponible, utilisation de la config par défaut');
      return null;
    }
    const json: any = await res.json();
    
    // Merger avec la config par défaut pour s'assurer que forbidden_apps est toujours défini
    const mergedConfig: any = {
      ...lastLockConfig,
      ...json,
      forbidden_apps: (json && json.forbidden_apps) ? json.forbidden_apps : lastLockConfig.forbidden_apps,
      allowed_apps: (json && json.allowed_apps) ? json.allowed_apps : lastLockConfig.allowed_apps,
      policy: (json && json.policy) ? json.policy : lastLockConfig.policy
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
    const exam: any = await res.json();
    if (exam && exam.allowed_apps) {
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
      
      // Log périodique pour debug
      const logCounter = (listProcessesLower as any).logCounter || 0;
      (listProcessesLower as any).logCounter = (logCounter + 1) % 50; // Log toutes les 50 fois
      if (logCounter === 0 && names.length > 0) {
        console.log('[Monitor] 🔍 Exemple de processus détectés:', names.slice(0, 10));
      }
      
      return names.join('\n');
    }
    const { stdout } = await execAsync('ps -A -o comm');
    return stdout.toLowerCase();
  } catch (e) {
    console.error('[Monitor] ❌ Erreur listProcessesLower:', e);
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

async function sendAlert(alert: any, mainWindow?: Electron.BrowserWindow | null): Promise<boolean> {
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
        
        console.log('[Monitor] 📋 Contexte récupéré:', { sessionId, examId, studentId, hasToken: !!token });
      } catch (e) {
        console.error('[Monitor] ❌ Erreur récupération contexte:', e);
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
    
    const alertPayload = {
      type: alert.type || 'forbidden_app',
      severity: alert.severity || 'high',
      description: description,
      session_id: sessionId || alert.session_id || null,
      exam_id: examId || alert.exam_id || null,
      student_id: studentId || alert.student_id || null,
      process: alert.process || null
    };
    
    console.log('[Monitor] 📤 Envoi alerte au backend:', alertPayload);
    
    const response = await fetch('http://localhost:8000/api/v1/alerts', {
      method: 'POST',
      headers,
      body: JSON.stringify(alertPayload)
    });
    
    if (response.ok) {
      const result: any = await response.json();
      console.log('[Monitor] ✅ Alerte envoyée avec succès au backend:', { 
        type: alert.type, 
        process: alert.process, 
        sessionId, 
        examId,
        alertId: result?.id || 'unknown',
        sessionBound: result?.session_bound || false
      });
      
      // L'alerte sera automatiquement envoyée à l'admin via WebSocket dans le backend
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Monitor] ❌ Erreur envoi alerte au backend:', response.status, errorText);
      return false;
    }
  } catch (e) {
    console.error('[Monitor] ❌ Exception lors de l\'envoi d\'alerte:', e);
    return false;
  }
}

// Compteurs pour appliquer repeat_threshold avant kill
const forbiddenCounters: Record<string, number> = {};
const lastNotifyAt: Record<string, number> = {};
// Compteur global pour limiter le nombre d'alertes envoyées par minute
const alertsSentThisMinute: { count: number; resetTime: number } = { count: 0, resetTime: Date.now() };
const MAX_ALERTS_PER_MINUTE = 10; // Maximum 10 alertes différentes par minute

async function killProcessWindows(procNameLower: string) {
  try {
    await execAsync(`taskkill /IM ${procNameLower} /F`);
  } catch {}
}

async function tickProcessMonitor(mainWindow: Electron.BrowserWindow | null) {
  try {
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
            console.log('[Monitor] 📝 Examen actif trouvé:', examId, 'Apps autorisées:', allowedApps?.length || 0);
          }
        } else {
          // Log seulement toutes les 10 itérations pour ne pas spammer
          const logCounter = (tickProcessMonitor as any).logCounter || 0;
          (tickProcessMonitor as any).logCounter = (logCounter + 1) % 10;
          if (logCounter === 0) {
            console.log('[Monitor] ℹ️ Aucun examen actif - utilisation de la liste noire par défaut');
          }
        }
      }
    } catch (e) {
      console.error('[Monitor] ❌ Erreur récupération examen actif:', e);
    }
    
    // Si on a une liste d'applications autorisées, bloquer tout le reste
    // Sinon, utiliser la liste des applications interdites
    const procSet = await listProcessNamesSet();
    if (!procSet.size) {
      console.warn('[Monitor] ⚠️ Aucun processus détecté - vérifier les permissions');
      return;
    }
    
    // Log périodique (toutes les 10 itérations = ~40 secondes)
    const logCounter = (tickProcessMonitor as any).logCounter || 0;
    if (logCounter === 0) {
      console.log('[Monitor] 🔍 Surveillance active -', procSet.size, 'processus détectés');
    }
  
  if (allowedApps && allowedApps.length > 0) {
    // Mode liste blanche : bloquer tout sauf les applications autorisées
    const allowedLower = allowedApps.map((s: string) => s.toLowerCase().replace('.exe', ''));
    
    // Liste complète des processus système Windows à ignorer
    const systemProcesses = [
      // Processus système Windows de base
      'explorer', 'dwm', 'winlogon', 'csrss', 'services', 'lsass', 'svchost', 'system', 'idle',
      'smss', 'csrss', 'wininit', 'winlogon', 'services', 'lsass', 'svchost', 'spoolsv',
      // Processus Windows Update et maintenance
      'trustedinstaller', 'tiworker', 'wuauclt', 'wusa', 'msiexec',
      // Processus Windows Shell et UI
      'startmenuexperiencehost', 'sihost', 'taskhostw', 'taskhost', 'dwm', 'explorer',
      'runtimebroker', 'applicationframehost', 'searchapp', 'searchindexer', 'searchprotocolhost',
      // Processus Windows Runtime
      'runtimebroker', 'dllhost', 'comsurrogate', 'wsmprovhost',
      // Processus de virtualisation et conteneurs
      'vmwp', 'vmmem', 'vmmemwsl', 'vmcompute', 'vmms', 'vmwp', 'vmware', 'vbox',
      // Processus Docker et WSL
      'docker', 'dockerd', 'docker desktop', 'wsl', 'wslhost', 'wslservice',
      // Processus graphiques et drivers
      'nvsphelper64', 'nvidia', 'nvcontainer', 'nvidia overlay', 'nvdisplay.container',
      'amd', 'ati', 'intel', 'igfx', 'igfxtray', 'igfxpers',
      // Processus de sécurité Windows
      'securityhealthservice', 'smartscreen', 'windowsdefender', 'msmpeng', 'mssense',
      // Processus réseau et services
      'netsh', 'netstat', 'ipconfig', 'ping', 'tracert',
      // Processus de développement (optionnel - peut être autorisé)
      'code', 'cursor', 'vscode', 'devenv', 'msbuild',
    ];
    
    for (const procName of procSet) {
      const procBase = procName.toLowerCase().replace('.exe', '').trim();
      
      // Ignorer les processus système
      const isSystemProcess = systemProcesses.some(sysProc => 
        procBase === sysProc || 
        procBase.includes(sysProc) || 
        sysProc.includes(procBase)
      );
      
      if (isSystemProcess) {
        // Log seulement toutes les 100 itérations pour ne pas spammer
        const logCounter = (tickProcessMonitor as any).systemLogCounter || 0;
        (tickProcessMonitor as any).systemLogCounter = (logCounter + 1) % 100;
        if (logCounter === 0) {
          console.log('[Monitor] ⚙️ Processus système ignoré:', procName);
        }
        continue;
      }
      
      // Vérifier si le processus est autorisé
      const isAllowed = allowedLower.some((allowed: string) => 
        procBase === allowed || procBase.includes(allowed) || allowed.includes(procBase)
      );
      
      if (!isAllowed) {
        // Déduplication stricte : max 1 fois toutes les 30 secondes
        const now = Date.now();
        const lastAlertTime = lastNotifyAt[procName] || 0;
        const timeSinceLastAlert = now - lastAlertTime;
        const DEDUP_INTERVAL = 30000; // 30 secondes
        
        if (timeSinceLastAlert < DEDUP_INTERVAL) {
          continue; // Ignorer si déjà alerté récemment
        }
        
        // Vérifier le quota global
        if (now > alertsSentThisMinute.resetTime + 60000) {
          alertsSentThisMinute.count = 0;
          alertsSentThisMinute.resetTime = now;
        }
        
        if (alertsSentThisMinute.count >= MAX_ALERTS_PER_MINUTE) {
          continue; // Quota atteint
        }
        
        lastNotifyAt[procName] = now;
        alertsSentThisMinute.count++;
        
        console.log('[Monitor] Application non autorisée détectée:', procName);
        await sendAlert({ type: 'forbidden_app', process: procName, severity: 'high' }, mainWindow);
        
        if (mainWindow) {
          mainWindow.webContents.send('student-warning', { 
            app: procName, 
            message: `⚠️ L'application "${procName}" n'est pas autorisée pendant l'examen.` 
          });
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

    // Liste complète des processus système Windows à ignorer (même en mode liste noire)
    const systemProcessesToIgnore = [
      // Processus système Windows de base
      'explorer', 'dwm', 'winlogon', 'csrss', 'services', 'lsass', 'svchost', 'system', 'idle',
      'smss', 'wininit', 'spoolsv', 'taskhostw', 'taskhost',
      // Processus Windows Update et maintenance
      'trustedinstaller', 'tiworker', 'wuauclt', 'wusa', 'msiexec',
      // Processus Windows Shell et UI
      'startmenuexperiencehost', 'sihost', 'runtimebroker', 'applicationframehost',
      'searchapp', 'searchindexer', 'searchprotocolhost',
      // Processus Windows Runtime
      'dllhost', 'comsurrogate', 'wsmprovhost',
      // Processus de virtualisation et conteneurs
      'vmwp', 'vmmem', 'vmmemwsl', 'vmcompute', 'vmms', 'vmware', 'vbox',
      // Processus Docker et WSL
      'docker', 'dockerd', 'docker desktop', 'wsl', 'wslhost', 'wslservice',
      // Processus graphiques et drivers
      'nvsphelper64', 'nvidia', 'nvcontainer', 'nvidia overlay', 'nvdisplay.container',
      'amd', 'ati', 'intel', 'igfx', 'igfxtray', 'igfxpers',
      // Processus de sécurité Windows
      'securityhealthservice', 'smartscreen', 'windowsdefender', 'msmpeng', 'mssense',
    ];

    // Log pour debug (toutes les 20 itérations pour ne pas spammer = ~80 secondes)
    const debugLogCounter = (tickProcessMonitor as any).debugCounter || 0;
    (tickProcessMonitor as any).debugCounter = (debugLogCounter + 1) % 20;
    
    if (procSet.size > 0 && debugLogCounter === 0) {
      const sampleProcesses = Array.from(procSet).slice(0, 30);
      console.log('[Monitor] 📊 Processus détectés (échantillon):', sampleProcesses);
      console.log('[Monitor] 🚫 Liste interdite à rechercher:', forbidden);
      console.log('[Monitor] 📈 Total processus:', procSet.size);
      
      // Vérifier manuellement si chrome ou cursor sont dans la liste
      const hasChrome = Array.from(procSet).some(p => p.includes('chrome'));
      const hasCursor = Array.from(procSet).some(p => p.includes('cursor'));
      console.log('[Monitor] 🔍 Vérification manuelle - Chrome présent:', hasChrome, 'Cursor présent:', hasCursor);
    }

    // Compteur pour les alertes détectées dans cette itération
    let alertsInThisTick = 0;

    for (const forb of forbidden) {
      // Ignorer si c'est un processus système
      const forbNormalized = forb.toLowerCase().replace('.exe', '').trim();
      const isSystemProcess = systemProcessesToIgnore.some(sysProc => 
        forbNormalized === sysProc || 
        forbNormalized.includes(sysProc) || 
        sysProc.includes(forbNormalized)
      );
      
      if (isSystemProcess) {
        // Ne pas créer d'alerte pour les processus système
        continue;
      }
      // Normaliser le nom (enlever .exe si présent, puis comparer)
      const forbNormalized = forb.toLowerCase().replace('.exe', '').trim();
      
      // Chercher dans tous les processus avec correspondance flexible
      let detectedName: string | null = null;
      
      for (const procName of procSet) {
        const procNormalized = procName.toLowerCase().replace('.exe', '').trim();
        
        // Ignorer les processus système même s'ils correspondent
        const isSystemProcess = systemProcessesToIgnore.some(sysProc => 
          procNormalized === sysProc || 
          procNormalized.includes(sysProc) || 
          sysProc.includes(procNormalized)
        );
        
        if (isSystemProcess) {
          continue; // Ignorer ce processus
        }
        
        // Correspondance exacte ou partielle (plus permissive)
        if (procNormalized === forbNormalized || 
            procNormalized.includes(forbNormalized) || 
            forbNormalized.includes(procNormalized) ||
            procName.toLowerCase() === forb.toLowerCase() ||
            procName.toLowerCase().includes(forb.toLowerCase()) ||
            forb.toLowerCase().includes(procName.toLowerCase())) {
          detectedName = procName; // Garder le nom original avec .exe si présent
          break;
        }
      }
      
      if (detectedName) {
        alertsInThisTick++;
        console.log('[Monitor] 🚫 Application interdite détectée:', detectedName, '(recherché:', forb, ')');
        
        // Vérifier le quota d'alertes par minute
        const now = Date.now();
        if (now > alertsSentThisMinute.resetTime + 60000) {
          // Réinitialiser le compteur après 1 minute
          alertsSentThisMinute.count = 0;
          alertsSentThisMinute.resetTime = now;
        }
        
        // Déduplication stricte : max 1 fois toutes les 30 secondes pour la même app
        const lastAlertTime = lastNotifyAt[detectedName] || 0;
        const timeSinceLastAlert = now - lastAlertTime;
        const DEDUP_INTERVAL = 30000; // 30 secondes entre les mêmes alertes
        
        if (timeSinceLastAlert < DEDUP_INTERVAL) {
          // Alerte déjà envoyée récemment, ignorer
          if (debugLogCounter === 0) {
            console.log(`[Monitor] ⏭️ Alerte ignorée (déjà envoyée il y a ${Math.floor(timeSinceLastAlert/1000)}s):`, detectedName);
          }
          continue; // Passer à la prochaine application interdite
        }
        
        // Vérifier le quota global d'alertes par minute
        if (alertsSentThisMinute.count >= MAX_ALERTS_PER_MINUTE) {
          console.log(`[Monitor] ⚠️ Quota d'alertes atteint (${MAX_ALERTS_PER_MINUTE}/min), alerte ignorée:`, detectedName);
          continue;
        }
        
        // Mettre à jour les compteurs
        lastNotifyAt[detectedName] = now;
        alertsSentThisMinute.count++;
        
        // Notifier l'étudiant dans l'interface
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            const warningMessage = `⚠️ L'application "${detectedName}" est interdite pendant l'examen.`;
            mainWindow.webContents.send('student-warning', { 
              app: detectedName, 
              message: warningMessage
            });
            console.log('[Monitor] 📢 Notification envoyée à l\'étudiant pour:', detectedName);
          } catch (e) {
            console.error('[Monitor] ❌ Erreur envoi notification étudiant:', e);
          }
        } else {
          console.warn('[Monitor] ⚠️ Fenêtre principale non disponible pour notifier l\'étudiant');
        }
        
        // Envoyer l'alerte au backend (cela l'enverra aussi à l'admin via WebSocket)
        // Faire cela en arrière-plan pour ne pas bloquer l'affichage
        sendAlert({ type: 'forbidden_app', process: detectedName, severity: 'high' }, mainWindow).then((alertSent) => {
          if (alertSent) {
            console.log('[Monitor] ✅ Alerte envoyée au backend et à l\'admin pour:', detectedName);
          } else {
            console.error('[Monitor] ❌ Échec envoi alerte pour:', detectedName);
          }
        }).catch((err) => {
          console.error('[Monitor] ❌ Exception lors de l\'envoi d\'alerte:', err);
        });
        
        // Auto-kill si configuré
        if (autoKill && process.platform === 'win32') {
          forbiddenCounters[detectedName] = (forbiddenCounters[detectedName] || 0) + 1;
          if (forbiddenCounters[detectedName] >= repeatThreshold) {
            console.log('[Monitor] 🔪 Tentative de fermeture forcée:', detectedName);
            await killProcessWindows(detectedName);
            forbiddenCounters[detectedName] = 0;
          }
        }
      } else if (debugLogCounter === 0) {
        // Log seulement si on cherche et qu'on ne trouve pas (pour debug)
        console.log('[Monitor] 🔍 Application recherchée mais non trouvée:', forb, '(normalisé:', forbNormalized, ')');
      }
    }
    
    // Log si des alertes ont été détectées
    if (alertsInThisTick > 0) {
      console.log(`[Monitor] ✅ ${alertsInThisTick} application(s) interdite(s) détectée(s) et alertes envoyées`);
    } else if (debugLogCounter === 0 && forbidden.length > 0) {
      console.log('[Monitor] ℹ️ Aucune application interdite détectée dans cette itération');
    }
  }
  } catch (error) {
    console.error('[Monitor] ❌ Erreur dans tickProcessMonitor:', error);
  }
}

function startProcessMonitor(mainWindow: Electron.BrowserWindow) {
  if (monitorInterval) {
    console.log('[Monitor] ⚠️ Monitoring déjà actif, redémarrage...');
    stopProcessMonitor();
  }
  
  console.log('[Monitor] 🚀 Démarrage du monitoring des processus...');
  console.log('[Monitor] 📋 Configuration:', {
    forbidden_apps: lastLockConfig.forbidden_apps?.length || 0,
    allowed_apps: lastLockConfig.allowed_apps?.length || 0,
    polling_interval: '4000ms'
  });
  
  monitorInterval = setInterval(() => {
    tickProcessMonitor(mainWindow);
  }, 4000); // toutes les 4s
  
  // Faire une première vérification immédiate après 1 seconde
  setTimeout(async () => {
    console.log('[Monitor] 🔍 Première vérification des processus (test immédiat)...');
    try {
      const procSet = await listProcessNamesSet();
      console.log('[Monitor] 📊 Test - Processus détectés:', procSet.size);
      if (procSet.size > 0) {
        const sample = Array.from(procSet).slice(0, 5);
        console.log('[Monitor] 📋 Exemple:', sample);
      }
      await tickProcessMonitor(mainWindow);
    } catch (e) {
      console.error('[Monitor] ❌ Erreur première vérification:', e);
    }
  }, 1000);
  
  console.log('[Monitor] ✅ Monitoring démarré avec succès (intervalle: 4s)');
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
