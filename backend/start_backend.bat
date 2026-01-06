@echo off
echo ========================================
echo  Demarrage du Backend ProctoFlex AI
echo ========================================
echo.

cd /d %~dp0

echo Verification de Python...
python --version
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

echo.
echo Verification des dependances...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installation des dependances...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERREUR: Impossible d'installer les dependances
        pause
        exit /b 1
    )
)

echo.
echo Demarrage du serveur sur http://localhost:8000
echo Appuyez sur CTRL+C pour arreter le serveur
echo.

python main.py

pause

