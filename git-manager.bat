@echo off
REM --- Script Maestro para Gestion de Git - Open Doors Management ---
REM Este script proporciona un menu interactivo para todas las operaciones Git

cls
:MENU
echo ===============================================
echo   Git Manager - Open Doors Management System
echo ===============================================
echo.
echo Selecciona una opcion:
echo.
echo 1. Verificar estado del repositorio
echo 2. Configurar repositorio Git (primera vez)
echo 3. Commit y push con mensaje personalizado
echo 4. Push rapido con mensaje estandar
echo 5. Crear backup completo del proyecto
echo 6. Ver logs y historial
echo 7. Sincronizar con repositorio remoto
echo 8. Salir
echo.
set /p choice="Ingresa tu opcion (1-8): "

if "%choice%"=="1" goto STATUS
if "%choice%"=="2" goto SETUP
if "%choice%"=="3" goto COMMIT
if "%choice%"=="4" goto QUICK
if "%choice%"=="5" goto BACKUP
if "%choice%"=="6" goto LOGS
if "%choice%"=="7" goto SYNC
if "%choice%"=="8" goto EXIT

echo Opcion invalida. Por favor, selecciona una opcion del 1 al 8.
pause
goto MENU

:STATUS
cls
echo ===============================================
echo   Verificando Estado del Repositorio
echo ===============================================
echo.
call git-status-check.bat
goto MENU

:SETUP
cls
echo ===============================================
echo   Configuracion del Repositorio Git
echo ===============================================
echo.
call git-setup-repo.bat
goto MENU

:COMMIT
cls
echo ===============================================
echo   Commit y Push Personalizado
echo ===============================================
echo.
call git-commit-all.bat
goto MENU

:QUICK
cls
echo ===============================================
echo   Push Rapido
echo ===============================================
echo.
call git-quick-push.bat
goto MENU

:BACKUP
cls
echo ===============================================
echo   Creando Backup del Proyecto
echo ===============================================
echo.
call git-backup.bat
goto MENU

:LOGS
cls
echo ===============================================
echo   Logs y Historial del Repositorio
echo ===============================================
echo.
echo Ultimos 10 commits:
echo ===================
git log --oneline -10

echo.
echo.
echo Estadisticas del repositorio:
echo =============================
git log --stat --oneline -5

echo.
echo.
echo ¿Deseas ver detalles de un commit especifico? (S/N)
set /p view_details="Respuesta: "

if /i "%view_details%" equ "S" (
  echo.
  echo Ingresa el hash del commit (primeros 7 caracteres):
  set /p commit_hash="Hash: "
  echo.
  git show --stat %commit_hash%
)

echo.
pause
goto MENU

:SYNC
cls
echo ===============================================
echo   Sincronizacion con Repositorio Remoto
echo ===============================================
echo.

echo Verificando cambios remotos...
git fetch origin

echo.
echo Comparando con rama remota...
git status -uno

echo.
echo ¿Deseas hacer pull de cambios remotos? (S/N)
set /p pull_confirm="Respuesta: "

if /i "%pull_confirm%" equ "S" (
  echo.
  echo Descargando cambios remotos...
  git pull origin main
)

echo.
echo ¿Deseas hacer push de cambios locales? (S/N)
set /p push_confirm="Respuesta: "

if /i "%push_confirm%" equ "S" (
  echo.
  echo Subiendo cambios locales...
  git push origin main
)

echo.
echo Sincronizacion completada.
pause
goto MENU

:EXIT
echo.
echo Gracias por usar Git Manager.
echo ¡Hasta luego!
echo.
pause
exit /b
