@echo off
echo 🔍 ProctoFlex AI - Diagnostic de l'Application
echo ==============================================
echo.

echo 📋 Vérification de l'environnement...
echo.

REM Vérifier les fichiers essentiels
echo 📁 Vérification des fichiers...
if exist "package.json" (
    echo ✅ package.json trouvé
) else (
    echo ❌ package.json manquant
    pause
    exit /b 1
)

if exist "src/render/main.tsx" (
    echo ✅ main.tsx trouvé
) else (
    echo ❌ main.tsx manquant
    pause
    exit /b 1
)

if exist "src/render/App.tsx" (
    echo ✅ App.tsx trouvé
) else (
    echo ❌ App.tsx manquant
    pause
    exit /b 1
)

echo.

REM Vérifier les dépendances
echo 📦 Vérification des dépendances...
if exist "node_modules" (
    echo ✅ node_modules trouvé
) else (
    echo ❌ node_modules manquant - Installation...
    npm install
)

echo.

REM Vérifier le serveur Vite
echo 🌐 Test du serveur Vite...
echo 📡 Démarrage du serveur Vite en mode test...
start "Vite Test" cmd /k "npm run dev:renderer"

echo ⏳ Attente du serveur Vite...
timeout /t 5 /nobreak >nul

echo 🔍 Test de connexion à Vite...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo ❌ Serveur Vite non accessible
    echo 💡 Vérifiez les logs dans la fenêtre Vite Test
) else (
    echo ✅ Serveur Vite accessible sur http://localhost:5173
)

echo.

REM Vérifier le backend
echo 🔗 Test du backend...
curl -s http://localhost:8000 >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend non accessible sur http://localhost:8000
    echo 💡 Démarrez le backend avec: cd .. && start_backend.bat
) else (
    echo ✅ Backend accessible sur http://localhost:8000
)

echo.

REM Test de compilation
echo 🔧 Test de compilation...
echo 📝 Compilation TypeScript...
tsc -p tsconfig.electron.json
if errorlevel 1 (
    echo ❌ Erreur de compilation TypeScript
) else (
    echo ✅ Compilation TypeScript réussie
)

echo.

echo 🎯 Diagnostic terminé !
echo.
echo 💡 Si l'application reste blanche :
echo    1. Vérifiez que le serveur Vite fonctionne sur http://localhost:5173
echo    2. Vérifiez que le backend fonctionne sur http://localhost:8000
echo    3. Ouvrez les outils de développement (F12) pour voir les erreurs
echo    4. Vérifiez les logs dans les fenêtres de commande
echo.

pause
