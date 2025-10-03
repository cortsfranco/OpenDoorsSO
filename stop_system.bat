@echo off
echo ==============================================
echo Deteniendo el sistema OpenDoors Billing
echo ==============================================

echo.
echo 1. Deteniendo servicios del frontend...
taskkill /f /im node.exe > nul 2>&1
echo Frontend detenido.

echo.
echo 2. Deteniendo servicios del backend...
taskkill /f /im python.exe > nul 2>&1
echo Backend detenido.

echo.
echo 3. Liberando puertos...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":3000"') do (
  taskkill /f /pid %%a > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":5000"') do (
  taskkill /f /pid %%a > nul 2>&1
)
echo Puertos liberados.

echo.
echo ==============================================
echo ¡Sistema OpenDoors detenido correctamente!
echo ==============================================
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
