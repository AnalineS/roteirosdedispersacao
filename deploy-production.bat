@echo off
echo ========================================
echo   DEPLOY PARA PRODUCAO
echo   Dominio: roteirosdispensacao.com.br
echo ========================================
echo.

REM Verificar se esta no diretorio correto
if not exist "firebase.json" (
    echo ERRO: Execute este script na raiz do projeto!
    pause
    exit /b 1
)

echo [1/5] Construindo o frontend Next.js...
cd apps\frontend-nextjs
call npm run build
if errorlevel 1 (
    echo ERRO: Falha no build do Next.js
    pause
    exit /b 1
)

echo.
echo [2/5] Voltando para o diretorio raiz...
cd ..\..

echo.
echo [3/5] Fazendo deploy no Firebase Hosting...
call firebase deploy --only hosting --project roteiros-de-dispensacao
if errorlevel 1 (
    echo ERRO: Falha no deploy do Firebase
    pause
    exit /b 1
)

echo.
echo [4/5] Construindo imagem do backend...
echo Esta etapa requer o Google Cloud SDK instalado
call gcloud builds submit --tag gcr.io/roteiros-de-dispensacao/backend:latest apps/backend
if errorlevel 1 (
    echo AVISO: Deploy do backend requer configuracao do Google Cloud SDK
    echo Continue manualmente com: gcloud run deploy
)

echo.
echo [5/5] Fazendo deploy do backend no Cloud Run...
call gcloud run deploy roteiro-dispensacao-api ^
    --image gcr.io/roteiros-de-dispensacao/backend:latest ^
    --platform managed ^
    --region us-central1 ^
    --allow-unauthenticated ^
    --set-env-vars="ENVIRONMENT=production,ALLOWED_ORIGINS=https://roteirosdispensacao.com.br"

echo.
echo ========================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo URLs de Producao:
echo   Frontend: https://roteirosdispensacao.com.br
echo   Backend:  https://api.roteirosdispensacao.com.br
echo.
echo Verifique o status em:
echo   https://console.firebase.google.com
echo   https://console.cloud.google.com
echo.
pause