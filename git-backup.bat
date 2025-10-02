@echo off
REM --- Script para crear backup del repositorio ---
REM Este script crea un backup completo del proyecto

cls
echo ===============================================
echo   Git Backup - Open Doors Management
echo ===============================================
echo.

set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
set backup_dir=backup_OpenDoors_%timestamp%

echo Creando backup en directorio: %backup_dir%
echo.

REM Crear directorio de backup
if not exist "%backup_dir%" mkdir "%backup_dir%"

echo Copiando archivos del proyecto...
xcopy /E /I /H /Y . "%backup_dir%\" /EXCLUDE:exclude_backup.txt

REM Crear archivo de exclusiones si no existe
if not exist "exclude_backup.txt" (
  echo .git > exclude_backup.txt
  echo node_modules >> exclude_backup.txt
  echo __pycache__ >> exclude_backup.txt
  echo *.pyc >> exclude_backup.txt
  echo .env >> exclude_backup.txt
  echo backup_* >> exclude_backup.txt
  echo .DS_Store >> exclude_backup.txt
  echo Thumbs.db >> exclude_backup.txt
  echo *.log >> exclude_backup.txt
  echo .vscode >> exclude_backup.txt
  echo .idea >> exclude_backup.txt
)

echo.
echo Backup completado en: %backup_dir%
echo.

REM Crear un archivo de informacion del backup
echo Backup creado el: %date% %time% > "%backup_dir%\backup_info.txt"
echo Proyecto: Open Doors Management System >> "%backup_dir%\backup_info.txt"
echo. >> "%backup_dir%\backup_info.txt"
echo Para restaurar este backup: >> "%backup_dir%\backup_info.txt"
echo 1. Copia todos los archivos a tu directorio de trabajo >> "%backup_dir%\backup_info.txt"
echo 2. Ejecuta: git-setup-repo.bat >> "%backup_dir%\backup_info.txt"
echo. >> "%backup_dir%\backup_info.txt"
echo Archivos incluidos: >> "%backup_dir%\backup_info.txt"
dir /B >> "%backup_dir%\backup_info.txt"

echo Informacion del backup guardada en: %backup_dir%\backup_info.txt
echo.
echo ¿Deseas comprimir el backup? (S/N)
set /p compress="Respuesta: "

if /i "%compress%" equ "S" (
  echo.
  echo Comprimiendo backup...
  powershell "Compress-Archive -Path '%backup_dir%' -DestinationPath '%backup_dir%.zip'"
  
  if exist "%backup_dir%.zip" (
    echo Backup comprimido: %backup_dir%.zip
    echo Eliminando directorio temporal...
    rmdir /S /Q "%backup_dir%"
  )
)

echo.
echo ¿Deseas hacer commit y push de los cambios actuales? (S/N)
set /p push_confirm="Respuesta: "

if /i "%push_confirm%" equ "S" (
  call git-quick-push.bat
)

echo.
echo Backup completado exitosamente.
echo.
pause
