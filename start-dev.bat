@echo off
REM --- Script para iniciar el entorno de desarrollo de Open Doors ---
REM Este script levanta la base de datos, el backend y el frontend
REM utilizando Docker Compose.

cls
echo ===============================================
echo   Iniciando Entorno de Desarrollo Open Doors  
echo ===============================================
echo.

REM 1. Verificar si Docker esta corriendo
echo Verificando que Docker este en ejecucion...
docker info > nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo Error: Docker no parece estar en ejecucion.
  echo Por favor, inicia Docker Desktop y vuelve a intentarlo.
  echo.
  pause
  exit /b
)
echo Docker esta activo.
echo.

REM 2. Verificar si existe el archivo .env
echo Verificando archivo de configuracion .env...
if exist ".env" (
  echo Archivo .env encontrado.
) else (
  echo.
  echo Advertencia: No se encontro el archivo .env
  echo Creando copia desde env.example...
  if exist "env.example" (
    copy env.example .env
    echo.
    echo IMPORTANTE: Edita el archivo .env con tus credenciales reales
    echo antes de continuar con el desarrollo.
    echo.
    pause
  ) else (
    echo Error: No se encontro el archivo env.example
    echo Por favor, asegurate de estar en el directorio correcto del proyecto.
    pause
    exit /b
  )
)

REM 3. Levantar los contenedores con docker-compose
echo Levantando los servicios (backend, db, frontend)...
echo Esto puede tardar unos minutos la primera vez.
echo.
docker-compose up --build -d

if %errorlevel% equ 0 (
  echo.
  echo ¡Entorno levantado con exito!
  echo.
  echo Puedes acceder a los siguientes servicios:
  echo -------------------------------------------------
  echo  Frontend (React):   http://localhost:3000
  echo  Backend (API Docs): http://localhost:8001/docs
  echo  Base de Datos:      localhost:5432
  echo -------------------------------------------------
  echo.
  echo Para ver los logs en tiempo real:
  echo   docker-compose logs -f
  echo.
  echo Para detener todos los servicios, ejecuta: stop-dev.bat
  echo.
  echo Verificando estado de los servicios...
  timeout /t 5 /nobreak > nul
  docker-compose ps
) else (
  echo.
  echo Error: Hubo un problema al levantar los contenedores.
  echo Revisa los mensajes de error para mas detalles.
  echo.
  echo Para ver los logs de error:
  echo   docker-compose logs
)

echo.
echo Presiona cualquier tecla para continuar...
pause > nul
