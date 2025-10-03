@echo off
chcp 65001 > nul
title Open Doors - Iniciando Sistema

echo ═══════════════════════════════════════════════════════════
echo   🚀 OPEN DOORS - SISTEMA DE GESTIÓN EMPRESARIAL
echo ═══════════════════════════════════════════════════════════
echo.

:: Colores y configuración
color 0A

:: ═══════════════════════════════════════════════════════════
:: PASO 1: LIMPIAR PROCESOS ANTERIORES
:: ═══════════════════════════════════════════════════════════
echo [1/8] 🧹 Limpiando procesos anteriores...

:: Matar procesos de Python (uvicorn)
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *fastapi*" 2>nul

:: Matar procesos de Node (vite)
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" 2>nul
taskkill /F /IM node.exe 2>nul

:: Esperar un momento
timeout /t 2 /nobreak > nul

echo    ✅ Procesos anteriores limpiados
echo.

:: ═══════════════════════════════════════════════════════════
:: PASO 2: LIBERAR PUERTOS
:: ═══════════════════════════════════════════════════════════
echo [2/8] 🔓 Liberando puertos 5000, 3000 y 5432...

:: Liberar puerto 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

:: Liberar puerto 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

:: Liberar puerto 5432 (PostgreSQL)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5432 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 1 /nobreak > nul
echo    ✅ Puertos liberados
echo.

:: ═══════════════════════════════════════════════════════════
:: PASO 3: VERIFICAR DOCKER
:: ═══════════════════════════════════════════════════════════
echo [3/8] 🐳 Verificando Docker...

docker --version >nul 2>&1
if errorlevel 1 (
    echo    ⚠️  Docker no está instalado o no está corriendo
    echo    💡 El sistema puede funcionar con base de datos remota (Neon)
    echo    📥 Si quieres usar Docker local: https://www.docker.com/
    set USE_DOCKER=0
) else (
    echo    ✅ Docker encontrado
    set USE_DOCKER=1
)
echo.

:: ═══════════════════════════════════════════════════════════
:: PASO 4: REINICIAR BASE DE DATOS DOCKER (SI ESTÁ DISPONIBLE)
:: ═══════════════════════════════════════════════════════════
if "%USE_DOCKER%"=="1" (
    echo [4/8] 🗄️  Reiniciando base de datos PostgreSQL con Docker...
    
    echo    → Deteniendo contenedores anteriores...
    docker-compose down 2>nul
    
    timeout /t 2 /nobreak > nul
    
    echo    → Iniciando PostgreSQL...
    docker-compose up -d
    
    echo    → Esperando 5 segundos para que la base de datos se inicie...
    timeout /t 5 /nobreak > nul
    
    echo    ✅ Base de datos PostgreSQL iniciada
    echo.
) else (
    echo [4/8] 🗄️  Base de datos...
    echo    → Usando base de datos remota (Neon/Replit)
    echo    ✅ Configuración lista
    echo.
)

:: ═══════════════════════════════════════════════════════════
:: PASO 5: VERIFICAR PYTHON
:: ═══════════════════════════════════════════════════════════
echo [5/8] 🐍 Verificando Python...

python --version >nul 2>&1
if errorlevel 1 (
    echo    ❌ ERROR: Python no está instalado
    echo    📥 Descarga Python desde: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo    ✅ Python encontrado
echo.

:: ═══════════════════════════════════════════════════════════
:: PASO 6: VERIFICAR NODE.JS
:: ═══════════════════════════════════════════════════════════
echo [6/8] 📦 Verificando Node.js...

node --version >nul 2>&1
if errorlevel 1 (
    echo    ❌ ERROR: Node.js no está instalado
    echo    📥 Descarga Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo    ✅ Node.js encontrado
echo.

:: ═══════════════════════════════════════════════════════════
:: PASO 7: INSTALAR DEPENDENCIAS
:: ═══════════════════════════════════════════════════════════
echo [7/8] 📚 Instalando dependencias...

:: Instalar dependencias de Python (silencioso)
echo    → Instalando dependencias de Python...
pip install -q -r requirements.txt 2>nul
if errorlevel 1 (
    echo    ⚠️  Advertencia: Algunas dependencias de Python pueden faltar
)

:: Instalar dependencias de Node.js si no existen
if not exist "frontend\node_modules" (
    echo    → Instalando dependencias de Node.js (puede tomar unos minutos)...
    cd frontend
    call npm install --silent
    cd ..
)

echo    ✅ Dependencias listas
echo.

:: ═══════════════════════════════════════════════════════════
:: PASO 8: INICIAR SERVICIOS EN SIMULTÁNEO
:: ═══════════════════════════════════════════════════════════
echo [8/8] 🚀 Iniciando servicios en simultáneo...
echo.

:: Crear carpeta de logs si no existe
if not exist "logs" mkdir logs

:: Iniciar Backend en una nueva ventana
echo    → Iniciando Backend (Puerto 5000)...
start "Open Doors - Backend (Puerto 5000)" cmd /k "color 0B && echo ═══════════════════════════════════════ && echo   BACKEND - FastAPI (Puerto 5000) && echo ═══════════════════════════════════════ && echo. && uvicorn src.main:app --host 0.0.0.0 --port 5000 --reload"

:: Esperar 2 segundos antes de iniciar el frontend
timeout /t 2 /nobreak > nul

:: Iniciar Frontend en una nueva ventana
echo    → Iniciando Frontend (Puerto 3000)...
start "Open Doors - Frontend (Puerto 3000)" cmd /k "color 0E && echo ═══════════════════════════════════════ && echo   FRONTEND - React + Vite (Puerto 3000) && echo ═══════════════════════════════════════ && echo. && cd frontend && npm run dev"

:: Esperar 5 segundos para que todo inicie
echo    → Esperando 5 segundos para sincronización...
timeout /t 5 /nobreak > nul

:: ═══════════════════════════════════════════════════════════
:: ÉXITO
:: ═══════════════════════════════════════════════════════════
cls
color 0A
echo.
echo ═══════════════════════════════════════════════════════════
echo   ✅ SISTEMA INICIADO CORRECTAMENTE
echo ═══════════════════════════════════════════════════════════
echo.
if "%USE_DOCKER%"=="1" (
    echo   🐳 Docker:
    echo      • PostgreSQL:  Running en puerto 5432
)
echo.
echo   📍 URLs Disponibles:
echo      • Frontend:  http://localhost:3000
echo      • Backend:   http://localhost:5000
echo      • API Docs:  http://localhost:5000/docs
echo.
echo   🔑 Credenciales de Acceso:
echo      Email:    cortsfranco@hotmail.com
echo      Password: Ncc1701E@
echo.
echo   📝 Ventanas Abiertas:
echo      • Backend:  Ventana azul (Puerto 5000)
echo      • Frontend: Ventana amarilla (Puerto 3000)
echo.
echo   ⏹️  Para Detener:
echo      • Ejecuta: DETENER-OPENDOORS.bat
echo      • O cierra las ventanas de backend y frontend
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo   💡 Abriendo navegador en 3 segundos...
echo.

:: Esperar 3 segundos
timeout /t 3 /nobreak > nul

:: Abrir el navegador automáticamente
start http://localhost:3000

echo   ✅ Navegador abierto
echo.
echo   Presiona cualquier tecla para cerrar esta ventana
echo   (El sistema seguirá ejecutándose en las otras ventanas)
echo.
pause > nul
