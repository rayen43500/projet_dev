# ProctoFlex AI - Application Desktop

Application de surveillance intelligente pour examens en ligne, développée avec Electron et React.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Git

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd desktop

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Construire l'application
npm run build

# Lancer l'application construite
npm run start
```

## 📁 Structure du Projet

```
desktop/
├── src/
│   └── renderer/          # Code React (interface utilisateur)
│       ├── components/    # Composants React
│       ├── contexts/      # Contextes React
│       ├── services/      # Services API
│       ├── types/         # Types TypeScript
│       └── ...
├── main.ts                # Point d'entrée Electron
├── preload.js             # Script de préchargement
├── index.html             # Page HTML principale
├── package.json           # Configuration npm
├── vite.config.ts         # Configuration Vite
├── tailwind.config.js     # Configuration Tailwind CSS
├── tsconfig.json          # Configuration TypeScript
└── electron-builder.json  # Configuration de build
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Démarrer en mode développement
- `npm run build` - Construire l'application
- `npm run start` - Lancer l'application construite
- `npm run dist` - Créer les packages de distribution
- `npm run lint` - Vérifier le code avec ESLint
- `npm run type-check` - Vérifier les types TypeScript

## 🔧 Configuration

### Variables d'Environnement
Créez un fichier `.env` à la racine :

```env
REACT_APP_API_URL=http://localhost:8000
NODE_ENV=development
```

### Configuration Electron
Les paramètres de sécurité et de fenêtre sont configurés dans `main.ts`.

## 🎨 Interface Utilisateur

L'application utilise :
- **React 18** avec TypeScript
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **React Router** pour la navigation
- **Zustand** pour la gestion d'état

## 🔒 Sécurité

- **Context Isolation** activé
- **Node Integration** désactivé
- **Web Security** activé
- **CSP** configuré
- **Navigation externe** bloquée

## 📱 Fonctionnalités

- ✅ Authentification sécurisée
- ✅ Reconnaissance faciale
- ✅ Surveillance des processus
- ✅ Enregistrement webcam/micro
- ✅ Verrouillage d'applications
- ✅ Interface responsive

## 🚨 Dépannage

### Problèmes Courants

1. **Erreur de permissions** : Vérifiez les droits d'accès webcam/micro
2. **Processus non détectés** : Vérifiez les permissions système
3. **Erreur de build** : Nettoyez `node_modules` et réinstallez

### Logs
Les logs sont disponibles dans :
- **Développement** : Console du navigateur
- **Production** : Console système

## 📦 Distribution

### Windows
```bash
npm run dist:win
```

### macOS
```bash
npm run dist:mac
```

### Linux
```bash
npm run dist:linux
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement
- Consultez la documentation complète
