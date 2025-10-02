@echo off
REM --- Script para hacer commit y push de todos los cambios ---
REM Este script agrega todos los archivos, hace commit y push al repositorio

cls
echo ===============================================
echo   Git Commit y Push - Open Doors Management
echo ===============================================
echo.

REM Verificar si estamos en un repositorio git
git status > nul 2>&1
if %errorlevel% neq 0 (
  echo Error: No se detecto un repositorio Git en este directorio.
  echo Por favor, asegurate de estar en el directorio correcto.
  pause
  exit /b
)

echo Verificando estado del repositorio...
git status

echo.
echo ¿Deseas continuar con el commit y push? (S/N)
set /p confirm="Respuesta: "

if /i "%confirm%" neq "S" (
  echo Operacion cancelada.
  pause
  exit /b
)

echo.
echo Agregando todos los archivos al staging area...
git add .

echo.
echo ¿Ingresa el mensaje de commit?
set /p commit_msg="Mensaje: "

if "%commit_msg%"=="" (
  set commit_msg="Actualizacion automatica - %date% %time%"
)

echo.
echo Haciendo commit con mensaje: %commit_msg%
git commit -m "%commit_msg%"

if %errorlevel% equ 0 (
  echo.
  echo Commit realizado exitosamente.
  echo.
  echo Haciendo push al repositorio remoto...
  git push origin main
  
  if %errorlevel% equ 0 (
    echo.
    echo ¡Push realizado exitosamente!
    echo Todos los cambios han sido subidos al repositorio.
  ) else (
    echo.
    echo Error: No se pudo hacer push al repositorio.
    echo Verifica tu conexion a internet y tus credenciales de Git.
  )
) else (
  echo.
  echo Error: No se pudo realizar el commit.
  echo Verifica que hay cambios para commitear.
)

echo.
echo Presiona cualquier tecla para continuar...
pause > nul
