# ProctoFlex AI - Application Desktop

Application desktop Electron pour la surveillance d'examens en ligne.

## 🚀 Démarrage Rapide

### Option 1: Script de développement amélioré (Recommandé)
```bash
# Double-cliquez sur le fichier
start_dev.bat
```

### Option 2: Script avec corrections automatiques
```bash
# Double-cliquez sur le fichier
start_fix.bat
```

### Option 2: Script automatique simple
```bash
# Double-cliquez sur le fichier
start_simple.bat
```

### Option 2: Commandes manuelles
```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer l'application
npm run dev
```

## 📋 Prérequis

- **Node.js** 16+ (https://nodejs.org/)
- **npm** (inclus avec Node.js)

## 🎯 Fonctionnalités

- **Authentification** - Connexion sécurisée
- **Vérification faciale** - Reconnaissance biométrique
- **Dashboard étudiant** - Interface utilisateur
- **Session d'examen** - Surveillance en temps réel
- **Monitoring des processus** - Détection de triche

## 📁 Structure

```
desktop/
├── src/
│   ├── renderer/          # Interface utilisateur React
│   │   ├── components/    # Composants React
│   │   ├── contexts/      # Contextes React
│   │   └── types/         # Types TypeScript
│   └── main.ts           # Processus principal Electron
├── package.json          # Dépendances et scripts
├── start_simple.bat      # Script de démarrage Windows
└── README_SIMPLE.md      # Cette documentation
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Démarrage en mode développement
- `npm run build` - Compilation pour production
- `npm run dist` - Création de l'exécutable

## 🔧 Configuration

L'application se connecte automatiquement au backend sur :
- **Backend URL**: http://localhost:8000
- **WebSocket**: ws://localhost:8000

## 🚨 Dépannage

### Erreur "ERR_FILE_NOT_FOUND"
```bash
# Utilisez start_dev.bat qui gère mieux la synchronisation
# Ou attendez que le serveur Vite soit prêt avant de lancer Electron
```

### Erreur "tsconfig.electron.json not found"
```bash
# Le script start_fix.bat corrige automatiquement ce problème
# Ou créez manuellement le fichier tsconfig.electron.json
```

### Erreur "enableRemoteModule does not exist"
```bash
# Le script start_fix.bat corrige automatiquement ce problème
# Ou supprimez manuellement la ligne 'enableRemoteModule: false,' du fichier main.ts
```

### Erreur "react-hot-toast not found"
```bash
npm install react-hot-toast
```

### Erreur de dépendances manquantes
```bash
npm install
```

### Problème de compilation TypeScript
```bash
npm run build
```

### Port déjà utilisé
Modifiez le port dans le backend ou arrêtez l'application qui utilise le port 8000.

## 📞 Support

1. Vérifiez que Node.js est installé
2. Exécutez `npm install`
3. Lancez `npm run dev`
4. Assurez-vous que le backend est démarré sur http://localhost:8000

## 🎯 Avantages

✅ **Interface moderne** - Design Tailwind CSS
✅ **Temps réel** - WebSockets pour communication
✅ **Sécurisé** - Authentification et vérification faciale
✅ **Cross-platform** - Windows, Mac, Linux
✅ **Démarrage simple** - Scripts automatisés
