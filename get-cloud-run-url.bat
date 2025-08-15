@echo off
echo ==========================================
echo OBTENDO URL DO CLOUD RUN
echo ==========================================
echo.

REM Obter a URL do Cloud Run
echo Obtendo URL do backend no Cloud Run...
gcloud run services describe roteiro-dispensacao-api --region=us-central1 --format="value(status.url)" > temp_url.txt
set /p BACKEND_URL=<temp_url.txt
del temp_url.txt

echo.
echo URL do Backend encontrada: %BACKEND_URL%
echo.

REM Criar arquivo .env.production.local com a URL correta
echo Criando arquivo de configuracao...
echo NEXT_PUBLIC_API_URL=%BACKEND_URL% > apps\frontend-nextjs\.env.production.local
echo NEXT_PUBLIC_ENVIRONMENT=production >> apps\frontend-nextjs\.env.production.local

echo.
echo Arquivo .env.production.local criado com sucesso!
echo.

REM Mostrar instrucoes
echo ==========================================
echo PROXIMOS PASSOS:
echo ==========================================
echo.
echo 1. Rebuild do frontend:
echo    cd apps\frontend-nextjs
echo    npm run build
echo.
echo 2. Deploy no Firebase:
echo    firebase deploy --only hosting
echo.
echo 3. Testar a conexao:
echo    curl %BACKEND_URL%/api/v1/health
echo.
echo ==========================================
echo URL DO BACKEND: %BACKEND_URL%
echo ==========================================
echo.
pause