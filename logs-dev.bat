@echo off
REM --- Script para ver logs del entorno de desarrollo de Open Doors ---
REM Este script muestra los logs de todos los servicios en tiempo real.

cls
echo ===============================================
echo   Logs del Entorno de Desarrollo Open Doors  
echo ===============================================
echo.

REM Verificar si Docker esta corriendo
docker info > nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo Error: Docker no parece estar en ejecucion.
  echo.
  pause
  exit /b
)

echo Mostrando logs de todos los servicios...
echo Presiona Ctrl+C para salir
echo.

docker-compose logs -f
