# Multi-stage Dockerfile completo para Cloud Run - Roteiro de Dispensação
# Stage 1: Build dependencies com cache otimizado
FROM python:3.11-slim as builder

# Metadados da imagem
LABEL maintainer="Roteiro de Dispensação API"
LABEL version="2.0.0"
LABEL description="Backend Flask completo para chatbot educacional sobre hanseníase"

# Configurar para evitar warnings do debconf
ARG DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar TODAS as dependências de build com cache APT estratégico
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections && \
    apt-get update && \
    echo "=== Verificando versão do Debian ===" && cat /etc/debian_version && \
    echo "=== Instalando dependências core ===" && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    pkg-config \
    cmake \
    ca-certificates \
    curl \
    wget \
    && echo "=== Instalando PostgreSQL development ===" && \
    apt-get install -y --no-install-recommends \
    libpq-dev \
    && echo "=== Instalando OpenCV dependencies ===" && \
    apt-get install -y --no-install-recommends \
    libgl1-mesa-dev \
    libglib2.0-dev \
    libsm6-dev \
    libxext-dev \
    libxrender-dev \
    libgomp1 \
    && echo "=== Instalando OCR dependencies ===" && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    && echo "=== Instalando Image processing (versões compatíveis) ===" && \
    (apt-get install -y --no-install-recommends libjpeg-dev || \
     apt-get install -y --no-install-recommends libjpeg62-turbo-dev) && \
    (apt-get install -y --no-install-recommends libpng-dev || \
     apt-get install -y --no-install-recommends libpng16-16) && \
    (apt-get install -y --no-install-recommends libtiff-dev || \
     apt-get install -y --no-install-recommends libtiff5-dev) && \
    apt-get install -y --no-install-recommends libv4l-dev \
    && echo "=== Instalando Multimedia (com fallbacks para Debian 12) ===" && \
    (apt-get install -y --no-install-recommends libavcodec-dev libavformat-dev libswscale-dev || \
     apt-get install -y --no-install-recommends libavcodec59 libavformat59 libswscale6 || \
     echo "Multimedia packages not available, skipping") && \
    (apt-get install -y --no-install-recommends libxvidcore-dev libx264-dev || \
     echo "Additional codecs not available, skipping") && \
    echo "=== Instalando Audio processing ===" && \
    (apt-get install -y --no-install-recommends portaudio19-dev libportaudio2 || \
     apt-get install -y --no-install-recommends portaudio19-dev || \
     echo "PortAudio not available, skipping") && \
    echo "=== Download manual tesseract português ===" && \
    mkdir -p /usr/share/tesseract-ocr/5/tessdata/ && \
    mkdir -p /usr/share/tesseract-ocr/4/tessdata/ && \
    (wget -q -O /usr/share/tesseract-ocr/5/tessdata/por.traineddata \
     https://github.com/tesseract-ocr/tessdata/raw/main/por.traineddata || \
     wget -q -O /usr/share/tesseract-ocr/4/tessdata/por.traineddata \
     https://github.com/tesseract-ocr/tessdata/raw/main/por.traineddata || \
     echo "Portuguese OCR data download failed, will use default language") && \
    rm -rf /var/lib/apt/lists/*

# Criar ambiente virtual otimizado
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copiar requirements primeiro (para cache Docker)
COPY requirements.txt .

# Instalar dependências Python com cache otimizado estratégico
# Cache multi-layer para máxima eficiência
RUN --mount=type=cache,target=/root/.cache/pip,sharing=locked \
    pip install --upgrade pip setuptools wheel && \
    pip install --timeout 1800 --no-deps -r requirements.txt || \
    pip install --timeout 1800 -r requirements.txt

# Stage 2: Runtime otimizado com cache
FROM python:3.11-slim

# Configurações de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar bibliotecas de runtime com compatibilidade Debian 12
RUN apt-get update && \
    echo "=== Runtime - Verificando versão do Debian ===" && cat /etc/debian_version && \
    echo "=== Instalando core runtime ===" && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && echo "=== Instalando PostgreSQL client ===" && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    && echo "=== Instalando OpenCV runtime ===" && \
    apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && echo "=== Instalando OCR runtime ===" && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && echo "=== Instalando Image processing runtime (versões genéricas) ===" && \
    (apt-get install -y --no-install-recommends libjpeg62-turbo || \
     apt-get install -y --no-install-recommends libjpeg-turbo-progs || \
     echo "JPEG library not available") && \
    (apt-get install -y --no-install-recommends libpng16-16 || \
     apt-get install -y --no-install-recommends libpng-tools || \
     echo "PNG library not available") && \
    (apt-get install -y --no-install-recommends libtiff5 || \
     apt-get install -y --no-install-recommends libtiff-tools || \
     echo "TIFF library not available") && \
    (apt-get install -y --no-install-recommends libv4l-0 || \
     echo "V4L library not available") && \
    echo "=== Instalando Multimedia runtime (com fallbacks Debian 12) ===" && \
    (apt-get install -y --no-install-recommends libavcodec59 libavformat59 libswscale6 || \
     apt-get install -y --no-install-recommends libavcodec58 libavformat58 libswscale5 || \
     apt-get install -y --no-install-recommends libavcodec-extra libavformat-extra || \
     echo "Multimedia runtime not available, features may be limited") && \
    echo "=== Instalando Audio processing runtime ===" && \
    (apt-get install -y --no-install-recommends libportaudio2 || \
     echo "PortAudio runtime not available") && \
    echo "=== Verificando tesseract português ===" && \
    mkdir -p /usr/share/tesseract-ocr/5/tessdata/ && \
    mkdir -p /usr/share/tesseract-ocr/4/tessdata/ && \
    (test -f /usr/share/tesseract-ocr/5/tessdata/por.traineddata || \
     test -f /usr/share/tesseract-ocr/4/tessdata/por.traineddata || \
     wget -q -O /usr/share/tesseract-ocr/5/tessdata/por.traineddata \
     https://github.com/tesseract-ocr/tessdata/raw/main/por.traineddata || \
     wget -q -O /usr/share/tesseract-ocr/4/tessdata/por.traineddata \
     https://github.com/tesseract-ocr/tessdata/raw/main/por.traineddata || \
     echo "Portuguese OCR data download failed, will use default language") && \
    rm -rf /var/lib/apt/lists/*

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

# Configurações específicas de bibliotecas - com fallback para v4
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