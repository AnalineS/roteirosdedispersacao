#!/bin/bash
# Script para iniciar Flask + Celery Workers
# Usado em produção (Google Cloud Run)
# Configuração SQLite + Google Cloud Storage (Redis removido)

echo "🚀 Iniciando sistema com Celery Workers..."

# Exportar variáveis de ambiente para workers
export ENVIRONMENT=${ENVIRONMENT:-production}
export CELERY_BROKER_TYPE=sqlite

# Função para iniciar worker em background
start_worker() {
    echo "📦 Iniciando Celery Worker $1..."
    celery -A celery_config worker \
        --loglevel=info \
        --concurrency=2 \
        --pool=threads \
        --hostname=worker-$1@%h \
        --queues=medical_chat \
        --detach
}

# Iniciar 2 workers em background
start_worker 1
start_worker 2

# Verificar se workers iniciaram
sleep 3
echo "✅ Workers iniciados. Verificando status..."
celery -A celery_config status

# Iniciar Flask API em foreground
echo "🌐 Iniciando Flask API..."
exec python main.py