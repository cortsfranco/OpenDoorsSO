@echo off
REM --- Script para verificar el estado del repositorio Git ---
REM Este script muestra el estado actual del repositorio

cls
echo ===============================================
echo   Git Status Check - Open Doors Management
echo ===============================================
echo.

REM Verificar si estamos en un repositorio git
git status > nul 2>&1
if %errorlevel% neq 0 (
  echo Error: No se detecto un repositorio Git en este directorio.
  echo.
  echo ¿Deseas inicializar un repositorio Git? (S/N)
  set /p init_repo="Respuesta: "
  
  if /i "%init_repo%" equ "S" (
    call git-setup-repo.bat
  )
  pause
  exit /b
)

echo Estado actual del repositorio:
echo ================================
git status

echo.
echo.
echo Informacion del repositorio remoto:
echo ====================================
git remote -v

echo.
echo.
echo Ultimos commits:
echo ================
git log --oneline -5

echo.
echo.
echo Archivos modificados (detalle):
echo ===============================
git diff --name-status

echo.
echo.
echo ¿Deseas hacer commit de los cambios? (S/N)
set /p commit_confirm="Respuesta: "

if /i "%commit_confirm%" equ "S" (
  call git-commit-all.bat
)

echo.
pause
