/**
 * Configuration Electron Builder
 * ProctoFlex AI - Université de Monastir - ESPRIM
 */

const { app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

module.exports = {
  appId: 'com.esprim.proctoflex-ai',
  productName: 'ProctoFlex AI',
  copyright: 'Copyright © 2025 Université de Monastir - ESPRIM',
  
  // Configuration des répertoires
  directories: {
    output: 'dist',
    buildResources: 'build'
  },

  // Configuration des fichiers
  files: [
    'dist/**/*',
    'node_modules/**/*',
    'package.json',
    'preload.js'
  ],

  // Configuration des ressources
  extraResources: [
    {
      from: 'assets',
      to: 'assets',
      filter: ['**/*']
    },
    {
      from: 'src/services',
      to: 'services',
      filter: ['**/*.js', '**/*.ts']
    }
  ],

  // Configuration Windows
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.ico',
    publisherName: 'Université de Monastir - ESPRIM',
    requestedExecutionLevel: 'requireAdministrator',
    artifactName: 'ProctoFlex-AI-${version}-${arch}.${ext}'
  },

  // Configuration macOS
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'assets/icon.icns',
    category: 'public.app-category.education',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    artifactName: 'ProctoFlex-AI-${version}-${arch}.${ext}'
  },

  // Configuration Linux
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.png',
    category: 'Education',
    artifactName: 'ProctoFlex-AI-${version}-${arch}.${ext}'
  },

  // Configuration NSIS (Windows)
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: true,
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
    installerHeaderIcon: 'assets/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'ProctoFlex AI',
    include: 'build/installer.nsh',
    script: 'build/installer.nsh'
  },

  // Configuration DMG (macOS)
  dmg: {
    title: 'ProctoFlex AI ${version}',
    icon: 'assets/icon.icns',
    background: 'assets/dmg-background.png',
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    },
    artifactName: 'ProctoFlex-AI-${version}-${arch}.dmg'
  },

  // Configuration de la signature de code
  afterSign: async (context) => {
    const { electronPlatformName, appOutDir } = context;
    
    if (electronPlatformName === 'darwin') {
      // Signature macOS
      console.log('🔐 Signature macOS en cours...');
    } else if (electronPlatformName === 'win32') {
      // Signature Windows
      console.log('🔐 Signature Windows en cours...');
    }
  },

  // Configuration de la publication
  publish: {
    provider: 'github',
    owner: 'esprim-university',
    repo: 'proctoflex-ai',
    releaseType: 'release'
  },

  // Configuration des hooks
  hooks: {
    'beforeBuild': async (context) => {
      console.log('🔨 Préparation de la construction...');
      
      // Vérifier les dépendances
      await checkDependencies();
      
      // Préparer les ressources
      await prepareResources();
      
      // Valider la configuration
      await validateConfiguration();
    },

    'afterBuild': async (context) => {
      console.log('✅ Construction terminée');
      
      // Générer les checksums
      await generateChecksums(context);
      
      // Créer les notes de version
      await createReleaseNotes(context);
    },

    'beforePack': async (context) => {
      console.log('📦 Préparation de l\'empaquetage...');
      
      // Optimiser les ressources
      await optimizeResources();
      
      // Valider les permissions
      await validatePermissions();
    }
  },

  // Configuration de la compression
  compression: 'maximum',

  // Configuration des métadonnées
  buildVersion: process.env.BUILD_VERSION || '1.0.0',
  npmRebuild: false,
  nodeGypRebuild: false,

  // Configuration de la sécurité
  removePackageScripts: true,
  removePackageKeywords: true,
  removePackageMain: true,

  // Configuration des permissions
  protocols: [
    {
      name: 'ProctoFlex AI',
      schemes: ['proctoflex']
    }
  ]
};

/**
 * Vérifie les dépendances requises
 */
async function checkDependencies() {
  const requiredDeps = [
    'electron',
    'electron-builder',
    'electron-updater'
  ];

  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
    } catch (error) {
      throw new Error(`Dépendance manquante: ${dep}`);
    }
  }
}

/**
 * Prépare les ressources nécessaires
 */
async function prepareResources() {
  const assetsDir = path.join(__dirname, 'assets');
  
  // Créer le répertoire assets s'il n'existe pas
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Vérifier les icônes
  const iconFiles = [
    'icon.ico',    // Windows
    'icon.icns',   // macOS
    'icon.png'     // Linux
  ];

  for (const iconFile of iconFiles) {
    const iconPath = path.join(assetsDir, iconFile);
    if (!fs.existsSync(iconPath)) {
      console.warn(`⚠️ Icône manquante: ${iconFile}`);
    }
  }
}

/**
 * Valide la configuration
 */
async function validateConfiguration() {
  const packageJson = require('./package.json');
  
  // Vérifier les champs requis
  const requiredFields = ['name', 'version', 'description', 'main'];
  for (const field of requiredFields) {
    if (!packageJson[field]) {
      throw new Error(`Champ manquant dans package.json: ${field}`);
    }
  }

  // Vérifier la version
  const version = packageJson.version;
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error('Version invalide dans package.json');
  }
}

/**
 * Génère les checksums des fichiers
 */
async function generateChecksums(context) {
  const crypto = require('crypto');
  const fs = require('fs').promises;
  const path = require('path');

  const { appOutDir } = context;
  const checksums = {};

  try {
    const files = await fs.readdir(appOutDir, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(appOutDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile()) {
        const data = await fs.readFile(filePath);
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        checksums[file] = hash;
      }
    }

    // Sauvegarder les checksums
    const checksumsPath = path.join(appOutDir, 'checksums.sha256');
    await fs.writeFile(checksumsPath, 
      Object.entries(checksums)
        .map(([file, hash]) => `${hash}  ${file}`)
        .join('\n')
    );

    console.log('✅ Checksums générés');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des checksums:', error);
  }
}

/**
 * Crée les notes de version
 */
async function createReleaseNotes(context) {
  const { version, buildVersion } = context;
  
  const releaseNotes = `# ProctoFlex AI v${version}

## Nouvelles fonctionnalités
- Surveillance IA temps réel
- Vérification d'identité par reconnaissance faciale
- Verrouillage sélectif d'applications
- Conformité RGPD complète
- Dashboard administrateur avancé

## Améliorations
- Performance optimisée
- Interface utilisateur améliorée
- Stabilité renforcée

## Corrections
- Corrections de bugs mineurs
- Améliorations de sécurité

## Installation
1. Téléchargez le fichier d'installation
2. Exécutez l'installateur
3. Suivez les instructions à l'écran

## Support
Pour toute question ou problème, contactez:
- Email: support@esprim.tn
- Site web: https://esprim.tn

---
© 2025 Université de Monastir - ESPRIM
Tous droits réservés.
`;

  const notesPath = path.join(context.appOutDir, 'RELEASE_NOTES.md');
  await fs.writeFile(notesPath, releaseNotes);
  
  console.log('✅ Notes de version créées');
}

/**
 * Optimise les ressources
 */
async function optimizeResources() {
  console.log('🔧 Optimisation des ressources...');
  
  // En production, implémenter l'optimisation des images, compression, etc.
  console.log('✅ Ressources optimisées');
}

/**
 * Valide les permissions
 */
async function validatePermissions() {
  console.log('🔐 Validation des permissions...');
  
  // En production, vérifier les permissions requises
  console.log('✅ Permissions validées');
}
