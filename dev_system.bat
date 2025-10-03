@echo off
echo ==============================================
echo Modo desarrollo OpenDoors Billing
echo ==============================================

echo.
echo 1. Deteniendo servicios existentes...
taskkill /f /im node.exe > nul 2>&1
taskkill /f /im python.exe > nul 2>&1

echo.
echo 2. Liberando puertos...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":3000"') do (
  taskkill /f /pid %%a > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":5000"') do (
  taskkill /f /pid %%a > nul 2>&1
)

echo.
echo 3. Iniciando backend en modo desarrollo...
start "Backend Dev" cmd /k "call venv\Scripts\activate.bat && python src\main_simple.py"

echo.
echo 4. Esperando 3 segundos...
timeout /t 3

echo.
echo 5. Iniciando frontend en modo desarrollo...
start "Frontend Dev" cmd /k "cd frontend && npm run dev"

echo.
echo ==============================================
echo ¡Servicios de desarrollo iniciados!
echo ==============================================
echo.
echo Servicios disponibles:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo - API Docs: http://localhost:5000/docs
echo.
echo Para detener los servicios, ejecuta: stop_system.bat
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
