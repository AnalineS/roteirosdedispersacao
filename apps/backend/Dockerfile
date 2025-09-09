# Dockerfile otimizado para Cloud Run - Roteiro de Dispensação
FROM python:3.11-slim

# Metadados da imagem
LABEL maintainer="Roteiro de Dispensação API"
LABEL version="1.0.0"
LABEL description="Backend Flask para chatbot educacional sobre hanseníase"

# Configurar diretório de trabalho
WORKDIR /app

# Configurar para evitar warnings do debconf ANTES de qualquer instalação
ARG DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependências do sistema necessárias com configuração completa
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && find /usr -name "*.pyc" -delete

# Criar usuário não-root para segurança
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Criar ambiente virtual para evitar warnings do pip
ENV VIRTUAL_ENV=/app/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copiar e instalar dependências Python primeiro (para cache do Docker)
COPY --chown=appuser:appuser requirements.txt .

# Instalar todas as dependências com timeout estendido e limpeza agressiva
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --no-compile --timeout 1200 -r requirements.txt && \
    find /app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /app -name "*.pyc" -delete && \
    rm -rf ~/.cache/pip/*

# Copiar código da aplicação (excluindo arquivos desnecessários)
COPY --chown=appuser:appuser . .

# Remover arquivos desnecessários após cópia
RUN rm -rf __pycache__ .pytest_cache logs temp \
    && rm -f requirements.txt requirements_optimized.txt \
    && find . -name "*.pyc" -delete \
    && find . -name "__pycache__" -type d -exec rm -rf {} + || true

# Ajustar permissões
RUN chown -R appuser:appuser /app
USER appuser

# Variáveis de ambiente para produção
ENV FLASK_ENV=production
ENV ENVIRONMENT=production

# Configurações para Cloud Run otimizadas para startup rápido
ENV WORKERS=1
ENV THREADS=2
ENV TIMEOUT=120
ENV KEEPALIVE=2
ENV MAX_REQUESTS=500
ENV MAX_REQUESTS_JITTER=50
ENV PRELOAD=false

# Feature flags - mantendo funcionalidade completa
ENV EMBEDDINGS_ENABLED=true
ENV ADVANCED_FEATURES=true
ENV RAG_AVAILABLE=true
ENV ADVANCED_CACHE=true
ENV LAZY_LOADING=true
ENV STARTUP_OPTIMIZATION=true

# Expor porta padrão para Cloud Run
EXPOSE 8080

# Health check otimizado para Cloud Run com mais tempo
HEALTHCHECK --interval=30s --timeout=15s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Comando ultra-otimizado para Cloud Run startup rápido
CMD exec gunicorn \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers $WORKERS \
    --threads $THREADS \
    --timeout $TIMEOUT \
    --keep-alive $KEEPALIVE \
    --max-requests $MAX_REQUESTS \
    --max-requests-jitter $MAX_REQUESTS_JITTER \
    --worker-class sync \
    --log-level warning \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --enable-stdio-inheritance \
    --graceful-timeout 30 \
    --worker-connections 100 \
    main:app
