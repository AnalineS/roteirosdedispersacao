# Multi-stage Dockerfile completo para Cloud Run - Roteiro de Dispensação
# Stage 1: Build dependencies
FROM python:3.11-slim as builder

# Metadados da imagem
LABEL maintainer="Roteiro de Dispensação API"
LABEL version="2.0.0"
LABEL description="Backend Flask completo para chatbot educacional sobre hanseníase"

# Configurar para evitar warnings do debconf
ARG DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar TODAS as dependências de build necessárias
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    pkg-config \
    cmake \
    ca-certificates \
    curl \
    # PostgreSQL development
    libpq-dev \
    # OpenCV dependencies
    libgl1-mesa-dev \
    libglib2.0-dev \
    libsm6-dev \
    libxext-dev \
    libxrender-dev \
    libgomp1 \
    # OCR dependencies
    tesseract-ocr \
    tesseract-ocr-por \
    libtesseract-dev \
    # Image processing
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    # Audio processing (for multimodal)
    libportaudio2 \
    libportaudiocpp0 \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Criar ambiente virtual otimizado
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copiar requirements primeiro (para cache Docker)
COPY requirements.txt .

# Instalar dependências Python com timeout estendido e otimizações
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --timeout 1800 -r requirements.txt && \
    # Limpar cache pip
    pip cache purge

# Stage 2: Runtime otimizado
FROM python:3.11-slim

# Configurações de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar bibliotecas de runtime necessárias
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    # PostgreSQL client
    libpq5 \
    # OpenCV runtime
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    # OCR runtime
    tesseract-ocr \
    tesseract-ocr-por \
    # Image processing runtime
    libjpeg62-turbo \
    libpng16-16 \
    libtiff5 \
    libavcodec58 \
    libavformat58 \
    libswscale5 \
    libv4l-0 \
    # Audio processing runtime
    libportaudio2 \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root para segurança
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copiar ambiente virtual completo do builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Configurar diretório de trabalho
WORKDIR /app

# Copiar código da aplicação
COPY --chown=appuser:appuser . .

# Limpeza e permissões
RUN find . -name "*.pyc" -delete && \
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true && \
    chown -R appuser:appuser /app

USER appuser

# Variáveis de ambiente para produção completa
ENV FLASK_ENV=production
ENV ENVIRONMENT=production

# Configurações para Cloud Run otimizadas
ENV WORKERS=1
ENV THREADS=2
ENV TIMEOUT=120
ENV KEEPALIVE=2
ENV MAX_REQUESTS=500
ENV MAX_REQUESTS_JITTER=50

# Feature flags - funcionalidade completa
ENV EMBEDDINGS_ENABLED=true
ENV ADVANCED_FEATURES=true
ENV RAG_AVAILABLE=true
ENV ADVANCED_CACHE=true
ENV LAZY_LOADING=true
ENV STARTUP_OPTIMIZATION=true
ENV MULTIMODAL_PROCESSING=true
ENV OCR_ENABLED=true
ENV COMPUTER_VISION=true

# Configurações específicas de bibliotecas
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata/
ENV OPENCV_LOG_LEVEL=ERROR
ENV NUMPY_DISABLE_SSE2=1

# Expor porta padrão para Cloud Run
EXPOSE 8080

# Health check otimizado para aplicação completa
HEALTHCHECK --interval=30s --timeout=15s --start-period=45s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Comando otimizado para Cloud Run startup
CMD exec gunicorn \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers ${WORKERS} \
    --threads ${THREADS} \
    --timeout ${TIMEOUT} \
    --keep-alive ${KEEPALIVE} \
    --max-requests ${MAX_REQUESTS} \
    --max-requests-jitter ${MAX_REQUESTS_JITTER} \
    --worker-class sync \
    --log-level warning \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --enable-stdio-inheritance \
    --graceful-timeout 30 \
    --worker-connections 100 \
    --preload \
    main:app