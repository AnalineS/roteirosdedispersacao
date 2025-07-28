@echo off
echo ========================================
echo 🧪 TESTE AUTOMATICO VERCEL DEPLOYMENT
echo ========================================
echo.

set /p VERCEL_URL="Digite a URL do seu projeto Vercel (ex: https://projeto.vercel.app): "

if "%VERCEL_URL%"=="" (
    echo ❌ URL não fornecida
    pause
    exit /b 1
)

echo.
echo 🔍 Testando endpoints...
echo.

echo ✅ 1. Testando Health Check...
curl -s "%VERCEL_URL%/api/health" > nul
if %errorlevel% equ 0 (
    echo    ✅ Health check OK
) else (
    echo    ❌ Health check FALHOU
)

echo.
echo ✅ 2. Testando Personas...
curl -s "%VERCEL_URL%/api/personas" > nul
if %errorlevel% equ 0 (
    echo    ✅ Personas OK
) else (
    echo    ❌ Personas FALHOU
)

echo.
echo ✅ 3. Testando Chat API...
curl -s -X POST "%VERCEL_URL%/api/chat" -H "Content-Type: application/json" -d "{\"question\":\"teste\",\"personality_id\":\"dr_gasnelio\"}" > nul
if %errorlevel% equ 0 (
    echo    ✅ Chat API OK
) else (
    echo    ❌ Chat API FALHOU
)

echo.
echo ✅ 4. Testando Landing Page...
curl -s "%VERCEL_URL%" > nul
if %errorlevel% equ 0 (
    echo    ✅ Landing Page OK
) else (
    echo    ❌ Landing Page FALHOU
)

echo.
echo ========================================
echo 🎯 TESTE COMPLETO
echo ========================================
echo.
echo 📊 Para verificar analytics acesse:
echo    https://vercel.com/dashboard
echo.
echo 📋 Para logs detalhados acesse:
echo    Vercel Dashboard > Functions > Logs
echo.

pause