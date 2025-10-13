# syntax=docker/dockerfile:1
# ============================================================================
# SIMPLIFIED PRODUCTION DOCKERFILE - Sistema Educacional Hanseníase
# 2-stage build for Flask medical application with AI personas
# Optimized for Cloud Run deployment with security hardening
# ============================================================================

ARG PYTHON_VERSION=3.11

# ============================================================================
# STAGE 1: BUILDER (System + Python dependencies)
# ============================================================================
FROM python:${PYTHON_VERSION}-slim as builder

# Install all dependencies in one layer for better caching
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build tools
    build-essential gcc g++ pkg-config \
    # Computer Vision and OCR dependencies
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 libglib2.0-dev \
    tesseract-ocr tesseract-ocr-por libtesseract-dev \
    # PostgreSQL client for Supabase
    libpq-dev \
    # Image processing
    libopencv-dev libgl1-mesa-dri libgthread-2.0-0 \
    # Networking
    curl ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /build

# Copy requirements and install Python dependencies
COPY requirements.txt .

# Install Python packages with optimized order for better Docker layer caching
RUN pip install --upgrade pip setuptools wheel && \
    # Install all dependencies in one step for better efficiency
    pip install --no-cache-dir -r requirements.txt && \
    # Clean up to reduce image size
    pip cache purge && \
    find /usr/local/lib/python*/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python*/site-packages -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# ============================================================================
# STAGE 2: PRODUCTION RUNTIME
# ============================================================================
FROM python:${PYTHON_VERSION}-slim as production

# Set production environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/tmp/.cache/huggingface \
    TRANSFORMERS_CACHE=/tmp/.cache/transformers \
    SENTENCE_TRANSFORMERS_HOME=/tmp/.cache/sentence-transformers \
    FLASK_ENV=production \
    DEBUG=False \
    TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

# Install minimal runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Runtime libraries for OpenCV and OCR
    libglib2.0-0 libsm6 libxext6 libxrender1 libgomp1 \
    libgl1-mesa-dri libgthread-2.0-0 \
    # PostgreSQL client
    libpq5 \
    # Tesseract runtime
    tesseract-ocr tesseract-ocr-por \
    # Process management and health checks
    dumb-init curl ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Create cache directories accessible by default user
RUN mkdir -p /tmp/.cache/huggingface && \
    mkdir -p /tmp/.cache/transformers && \
    mkdir -p /tmp/.cache/sentence-transformers && \
    chmod -R 777 /tmp/.cache

WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=builder /usr/local/lib/python*/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p logs uploads cache data

# Copy entrypoint script from external file (most reliable approach)
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Health check for medical application
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Expose port
EXPOSE 8080

# Use simplified entrypoint
ENTRYPOINT ["dumb-init", "--", "/entrypoint.sh"]

# ============================================================================
# METADATA
# ============================================================================
LABEL maintainer="Roteiro de Dispensação Medical AI" \
      version="3.1.0" \
      description="Simplified Flask medical application with AI personas" \
      security.hardened="true" \
      medical.lgpd_compliant="true" \
      ai.personas="dr_gasnelio,ga" \
      build.optimized="true"