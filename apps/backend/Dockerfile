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
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuário não-root para segurança
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Criar ambiente virtual para evitar warnings do pip
ENV VIRTUAL_ENV=/app/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copiar e instalar dependências Python primeiro (para cache do Docker)
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn==21.2.0

# Copiar código da aplicação
COPY . .

# Ajustar permissões
RUN chown -R appuser:appuser /app
USER appuser

# Variáveis de ambiente para produção
ENV FLASK_ENV=production

# Configurações para Cloud Run
ENV WORKERS=1
ENV THREADS=8
ENV TIMEOUT=300
ENV KEEPALIVE=2
ENV MAX_REQUESTS=1000
ENV MAX_REQUESTS_JITTER=100

# Expor porta padrão para Cloud Run
EXPOSE 8080

# Health check otimizado para Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/api/health || exit 1

# Comando otimizado para Cloud Run com fallback para porta padrão
CMD exec gunicorn \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers $WORKERS \
    --threads $THREADS \
    --timeout $TIMEOUT \
    --keep-alive $KEEPALIVE \
    --max-requests $MAX_REQUESTS \
    --max-requests-jitter $MAX_REQUESTS_JITTER \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    main:app
