@echo off
REM --- Script para reiniciar el entorno de desarrollo de Open Doors ---
REM Este script reinicia todos los servicios de manera segura.

cls
echo ===============================================
echo   Reiniciando Entorno de Desarrollo Open Doors  
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

echo Deteniendo servicios existentes...
docker-compose down

echo.
echo Iniciando servicios nuevamente...
docker-compose up --build -d

if %errorlevel% equ 0 (
  echo.
  echo ¡Servicios reiniciados correctamente!
  echo.
  echo Puedes acceder a los siguientes servicios:
  echo -------------------------------------------------
  echo  Frontend (React):   http://localhost:3000
  echo  Backend (API Docs): http://localhost:8000/docs
  echo -------------------------------------------------
) else (
  echo.
  echo Error: Hubo un problema al reiniciar los servicios.
)

echo.
pause
