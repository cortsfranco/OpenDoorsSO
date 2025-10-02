@echo off
REM --- Script para detener el entorno de desarrollo de Open Doors ---
REM Este script detiene todos los contenedores de manera segura.

cls
echo ===============================================
echo   Deteniendo Entorno de Desarrollo Open Doors  
echo ===============================================
echo.

REM Verificar si Docker esta corriendo
docker info > nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo Error: Docker no parece estar en ejecucion.
  echo No hay contenedores que detener.
  echo.
  pause
  exit /b
)

echo Deteniendo todos los servicios...
echo.

REM Detener contenedores
docker-compose down

if %errorlevel% equ 0 (
  echo.
  echo ¡Servicios detenidos correctamente!
  echo.
  echo Los contenedores han sido detenidos y eliminados.
  echo Los datos de la base de datos se mantienen en el volumen.
  echo.
  echo Para iniciar nuevamente, ejecuta: start-dev.bat
) else (
  echo.
  echo Error al detener los servicios.
  echo Revisa los mensajes de error para mas detalles.
)

echo.
echo Presiona cualquier tecla para continuar...
pause > nul
