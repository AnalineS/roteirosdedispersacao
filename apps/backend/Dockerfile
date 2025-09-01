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

# Instalar dependências críticas primeiro para evitar timeout
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --timeout 600 \
        Flask==3.1.2 \
        Flask-CORS==6.0.1 \
        Werkzeug==3.1.3 \
        gunicorn==23.0.0 \
        openai \
        PyJWT==2.10.1 \
        cryptography==45.0.6 \
        requests==2.32.4 \
        python-dotenv==1.1.1 \
        pydantic \
        google-cloud-firestore \
        google-cloud-logging && \
    pip install --no-cache-dir --timeout 600 -r requirements.txt

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

# Configurações para Cloud Run otimizadas
ENV WORKERS=1
ENV THREADS=4
ENV TIMEOUT=300
ENV KEEPALIVE=2
ENV MAX_REQUESTS=1000
ENV MAX_REQUESTS_JITTER=100

# Feature flags - por padrão desabilitados para evitar timeout
ENV EMBEDDINGS_ENABLED=false
ENV ADVANCED_FEATURES=false
ENV RAG_AVAILABLE=false
ENV ADVANCED_CACHE=false

# Expor porta padrão para Cloud Run
EXPOSE 8080

# Health check otimizado para Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/api/v1/health || exit 1

# Comando otimizado para Cloud Run sem preload (lazy loading)
CMD exec gunicorn \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers $WORKERS \
    --threads $THREADS \
    --timeout $TIMEOUT \
    --keep-alive $KEEPALIVE \
    --max-requests $MAX_REQUESTS \
    --max-requests-jitter $MAX_REQUESTS_JITTER \
    --worker-class sync \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --enable-stdio-inheritance \
    main:app
