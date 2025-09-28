@echo off
REM Script para iniciar Flask + Celery Workers no Windows
REM Usado em desenvolvimento local
REM Configuração SQLite + Google Cloud Storage (Redis removido)

echo 🚀 Iniciando sistema com Celery Workers...

REM Configurar variáveis de ambiente
set ENVIRONMENT=development
set CELERY_BROKER_TYPE=sqlite

REM Iniciar Worker 1 em nova janela
echo 📦 Iniciando Celery Worker 1...
start "Celery Worker 1" cmd /k "celery -A celery_config worker --loglevel=info --concurrency=2 --pool=threads --hostname=worker-1@%%h --queues=medical_chat"

REM Aguardar worker iniciar
timeout /t 3 /nobreak >nul

REM Iniciar Worker 2 em nova janela (opcional)
REM echo 📦 Iniciando Celery Worker 2...
REM start "Celery Worker 2" cmd /k "celery -A celery_config worker --loglevel=info --concurrency=2 --pool=threads --hostname=worker-2@%%h --queues=medical_chat"

REM Verificar status
echo ✅ Worker iniciado. Verificando status...
celery -A celery_config status

REM Iniciar Flask API na janela atual
echo 🌐 Iniciando Flask API...
python main.py