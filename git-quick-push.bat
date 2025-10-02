@echo off
REM --- Script para push rapido con mensaje predefinido ---
REM Este script hace un commit y push rapido con un mensaje estandar

cls
echo ===============================================
echo   Git Quick Push - Open Doors Management
echo ===============================================
echo.

REM Verificar si estamos en un repositorio git
git status > nul 2>&1
if %errorlevel% neq 0 (
  echo Error: No se detecto un repositorio Git en este directorio.
  pause
  exit /b
)

echo Agregando todos los archivos...
git add .

echo.
echo Haciendo commit con mensaje estandar...
set commit_msg="Update: %date% %time% - Open Doors Management System"

git commit -m %commit_msg%

if %errorlevel% equ 0 (
  echo.
  echo Commit realizado. Haciendo push...
  git push origin main
  
  if %errorlevel% equ 0 (
    echo.
    echo ¡Push exitoso! Cambios subidos al repositorio.
  ) else (
    echo.
    echo Error en el push. Verifica tu conexion.
  )
) else (
  echo.
  echo No hay cambios para commitear.
)

echo.
pause
