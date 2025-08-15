@echo off
echo ========================================
echo   DEPLOY PARA HOMOLOGACAO
echo   Dominio: homolog.roteirosdispensacao.com.br
echo ========================================
echo.

REM Verificar se esta no diretorio correto
if not exist "firebase.json" (
    echo ERRO: Execute este script na raiz do projeto!
    pause
    exit /b 1
)

echo [1/5] Construindo o frontend Next.js para staging...
cd apps\frontend-nextjs

REM Criar arquivo .env.staging se nao existir
if not exist ".env.staging" (
    echo NEXT_PUBLIC_API_URL=https://api-homolog.roteirosdispensacao.com.br > .env.staging
    echo NEXT_PUBLIC_ENVIRONMENT=staging >> .env.staging
    echo NEXT_PUBLIC_SITE_URL=https://homolog.roteirosdispensacao.com.br >> .env.staging
)

REM Copiar .env.staging para .env.production.local temporariamente
copy .env.staging .env.production.local
call npm run build
del .env.production.local

if errorlevel 1 (
    echo ERRO: Falha no build do Next.js
    pause
    exit /b 1
)

echo.
echo [2/5] Voltando para o diretorio raiz...
cd ..\..

echo.
echo [3/5] Criando canal de homologacao no Firebase...
call firebase hosting:channel:create homolog --expires 30d --project roteiros-de-dispensacao 2>nul

echo.
echo [4/5] Fazendo deploy no canal de homologacao...
call firebase hosting:channel:deploy homolog --project roteiros-de-dispensacao
if errorlevel 1 (
    echo ERRO: Falha no deploy do Firebase
    pause
    exit /b 1
)

echo.
echo [5/5] Construindo e fazendo deploy do backend staging...
echo Esta etapa requer o Google Cloud SDK instalado
call gcloud builds submit --tag gcr.io/roteiros-de-dispensacao/backend:staging apps/backend
if errorlevel 1 (
    echo AVISO: Deploy do backend requer configuracao do Google Cloud SDK
    echo Continue manualmente com os comandos gcloud
)

call gcloud run deploy roteiro-dispensacao-api-staging ^
    --image gcr.io/roteiros-de-dispensacao/backend:staging ^
    --platform managed ^
    --region us-central1 ^
    --allow-unauthenticated ^
    --set-env-vars="ENVIRONMENT=staging,ALLOWED_ORIGINS=https://homolog.roteirosdispensacao.com.br"

echo.
echo ========================================
echo   DEPLOY DE HOMOLOGACAO CONCLUIDO!
echo ========================================
echo.
echo URLs de Homologacao:
echo   Frontend: https://homolog.roteirosdispensacao.com.br
echo   Backend:  https://api-homolog.roteirosdispensacao.com.br
echo.
echo Preview URL temporaria do Firebase:
call firebase hosting:channel:list --project roteiros-de-dispensacao | findstr homolog
echo.
echo Verifique o status em:
echo   https://console.firebase.google.com
echo   https://console.cloud.google.com
echo.
pause