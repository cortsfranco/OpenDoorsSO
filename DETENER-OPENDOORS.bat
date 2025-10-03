@echo off
chcp 65001 > nul
title Open Doors - Deteniendo Sistema
color 0C

echo.
echo ═══════════════════════════════════════════════════════════
echo   ⏹️  OPEN DOORS - DETENIENDO SISTEMA
echo ═══════════════════════════════════════════════════════════
echo.

echo [1/3] 🛑 Deteniendo Backend (Puerto 5000)...

:: Matar procesos de Python (uvicorn)
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *Backend*" 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul

:: Liberar puerto 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

echo    ✅ Backend detenido
echo.

echo [2/3] 🛑 Deteniendo Frontend (Puerto 3000)...

:: Matar procesos de Node (vite)
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *Frontend*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" 2>nul

:: Liberar puerto 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

echo    ✅ Frontend detenido
echo.

echo [3/3] 🧹 Limpieza final...
timeout /t 1 /nobreak > nul
echo    ✅ Limpieza completada
echo.

echo ═══════════════════════════════════════════════════════════
echo   ✅ SISTEMA DETENIDO COMPLETAMENTE
echo ═══════════════════════════════════════════════════════════
echo.
echo   Puedes cerrar esta ventana
echo.

timeout /t 3 /nobreak
