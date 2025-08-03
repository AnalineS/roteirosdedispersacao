# Dockerfile otimizado para Cloud Run - Roteiro de Dispensação
FROM python:3.11-slim

# Metadados da imagem
LABEL maintainer="Roteiro de Dispensação API"
LABEL version="1.0.0"
LABEL description="Backend Flask para chatbot educacional sobre hanseníase"

# Configurar diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuário não-root para segurança
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copiar e instalar dependências Python primeiro (para cache do Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn==21.2.0

# Copiar código da aplicação
COPY . .

# Ajustar permissões
RUN chown -R appuser:appuser /app
USER appuser

# Variáveis de ambiente para produção
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_ENV=production
ENV PORT=8080
ENV WORKERS=1
ENV THREADS=8
ENV TIMEOUT=300
ENV KEEPALIVE=2
ENV MAX_REQUESTS=1000
ENV MAX_REQUESTS_JITTER=100

# Expor porta padrão do Cloud Run
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Comando otimizado para Cloud Run
CMD exec gunicorn \
    --bind :$PORT \
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