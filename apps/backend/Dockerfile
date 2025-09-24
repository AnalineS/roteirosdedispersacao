# ============================================================================
# DOCKERFILE CONSOLIDADO - Sistema Educacional Hanseníase
# Multi-stage build otimizado para Cloud Run com build args
# Suporta: staging, production, e celery workers
# ============================================================================

# Build arguments para configurar ambiente
ARG ENVIRONMENT=production
ARG ENABLE_CELERY=false
ARG PYTHON_VERSION=3.11

# === STAGE 1: BUILD DEPENDENCIES ===
FROM python:${PYTHON_VERSION}-slim as builder

# Metadados dinâmicos
ARG ENVIRONMENT
ARG ENABLE_CELERY
LABEL maintainer="Roteiro de Dispensação API"
LABEL version="2.1.0"
LABEL description="Backend Flask consolidado para ${ENVIRONMENT}"
LABEL celery_enabled="${ENABLE_CELERY}"

# Configurações de build
ARG DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Instalar apenas dependências essenciais de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    curl \
    ca-certificates \
    pkg-config \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copiar requirements e instalar dependências Python
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11/site-packages -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# === STAGE 2: RUNTIME OPTIMIZADO ===
FROM python:${PYTHON_VERSION}-slim as runtime

# Build arguments para runtime
ARG ENVIRONMENT
ARG ENABLE_CELERY

# Configurações de runtime baseadas no ambiente
ENV ENVIRONMENT=${ENVIRONMENT}
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Configurações específicas por ambiente
RUN if [ "$ENVIRONMENT" = "staging" ]; then \
        export FLASK_ENV=development; \
        export DEBUG=True; \
    else \
        export FLASK_ENV=production; \
        export DEBUG=False; \
    fi

WORKDIR /app

# Instalar apenas runtime dependencies mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuário não-root para segurança
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copiar dependências Python do builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copiar código da aplicação
COPY . .

# Configurar permissões
RUN chown -R appuser:appuser /app

# Criar diretórios necessários
RUN mkdir -p /app/logs /app/uploads /app/cache && \
    chown -R appuser:appuser /app/logs /app/uploads /app/cache

# Criar script de entrypoint dinâmico
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Configurar ambiente\n\
export ENVIRONMENT=${ENVIRONMENT}\n\
\n\
# Health check inicial\n\
echo "🏥 Starting Roteiro de Dispensação API - Environment: $ENVIRONMENT"\n\
\n\
# Verificar dependências críticas\n\
python -c "import flask, openai, chromadb, pydantic; print('"'"'✅ Core dependencies loaded'"'"')"\n\
\n\
# Inicializar baseado na configuração\n\
if [ "${ENABLE_CELERY}" = "true" ]; then\n\
    echo "🔄 Starting with Celery workers"\n\
    exec dumb-init celery -A main:celery worker --loglevel=info --concurrency=2\n\
else\n\
    echo "🚀 Starting Flask application"\n\
    exec dumb-init python main.py\n\
fi' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Configurar usuário
USER appuser

# Configurar health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expor porta
EXPOSE 8080

# Configurar entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]