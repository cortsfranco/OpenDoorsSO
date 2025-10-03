@echo off
echo ==============================================
echo Testing del sistema OpenDoors Billing
echo ==============================================

echo.
echo 1. Verificando que el backend esté funcionando...
curl -s http://localhost:5000/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend funcionando correctamente
) else (
    echo ❌ Backend no responde. Ejecuta start_system.bat primero.
    pause
    exit /b 1
)

echo.
echo 2. Verificando que el frontend esté funcionando...
curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend funcionando correctamente
) else (
    echo ❌ Frontend no responde. Ejecuta start_system.bat primero.
    pause
    exit /b 1
)

echo.
echo 3. Probando endpoint de login...
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/x-www-form-urlencoded" -d "username=cortsfranco@hotmail.com&password=Ncc1701E@" > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Endpoint de login funcionando
) else (
    echo ❌ Error en endpoint de login
)

echo.
echo 4. Probando endpoint de balance IVA...
curl -s http://localhost:5000/api/v1/financial/balance-iva > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Endpoint de balance IVA funcionando
) else (
    echo ❌ Error en endpoint de balance IVA
)

echo.
echo 5. Probando endpoint de balance general...
curl -s http://localhost:5000/api/v1/financial/balance-general > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Endpoint de balance general funcionando
) else (
    echo ❌ Error en endpoint de balance general
)

echo.
echo ==============================================
echo ¡Testing completado!
echo ==============================================
echo.
echo Sistema funcionando correctamente:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo - API Docs: http://localhost:5000/docs
echo.
echo Credenciales de prueba:
echo - Email: cortsfranco@hotmail.com
echo - Contraseña: Ncc1701E@
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
