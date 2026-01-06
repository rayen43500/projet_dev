@echo off
echo 📋 Copie du fichier preload.js...
echo.

REM Créer le dossier dist s'il n'existe pas
if not exist "dist" (
    echo 📁 Création du dossier dist...
    mkdir dist
)

REM Copier le fichier preload.js
if exist "preload.js" (
    echo 📄 Copie de preload.js vers dist/
    copy "preload.js" "dist\preload.js" >nul
    echo ✅ Fichier preload.js copié avec succès
) else (
    echo ❌ Fichier preload.js non trouvé
    pause
    exit /b 1
)

echo.
echo ✅ Opération terminée !
pause
