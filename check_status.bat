@echo off
echo ========================================
echo ProctoFlex AI - Diagnostic System
echo ========================================
echo.

echo [1/4] Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)

echo [2/4] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)

echo [3/4] Checking npm installation...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)

echo [4/4] Checking project structure...
if not exist "backend" (
    echo ERROR: Backend folder not found!
    pause
    exit /b 1
)
if not exist "frontend" (
    echo ERROR: Frontend folder not found!
    pause
    exit /b 1
)
if not exist "desktop" (
    echo ERROR: Desktop folder not found!
    pause
    exit /b 1
)

echo.
echo ========================================
echo All checks passed! System is ready.
echo ========================================
echo.
echo To start all services, run: start_all_services.bat
echo.
pause
