@echo off
REM Script de configuração do Google Cloud CLI
REM Roteiro de Dispensação - Deploy para Cloud Run

echo === Configuração do Google Cloud CLI ===
echo.

REM Verificar se gcloud está instalado
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Google Cloud CLI não está instalado!
    echo Execute primeiro: scripts\install-gcloud.ps1
    echo Ou baixe de: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo Versão do gcloud:
gcloud --version
echo.

echo === Autenticação ===
echo Execute o comando abaixo para fazer login:
echo gcloud auth login
echo.

echo === Configuração do Projeto ===
echo 1. Crie um projeto no Google Cloud Console
echo 2. Anote o PROJECT_ID
echo 3. Execute: gcloud config set project SEU_PROJECT_ID
echo.

echo === Habilitar APIs ===
echo Execute os comandos abaixo:
echo gcloud services enable run.googleapis.com
echo gcloud services enable cloudbuild.googleapis.com
echo gcloud services enable artifactregistry.googleapis.com
echo.

echo === Comandos de Deploy ===
echo Para fazer deploy do backend:
echo cd src\backend
echo gcloud run deploy roteiro-dispensacao-api --source . --platform managed --region us-central1 --allow-unauthenticated
echo.

echo Pressione qualquer tecla para continuar...
pause >nul