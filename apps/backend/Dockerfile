# ============================================================================
# OPTIMIZED PRODUCTION DOCKERFILE - Sistema Educacional Hanseníase
# Multi-stage build for Flask medical application with AI personas
# Optimized for Cloud Run deployment with security hardening
# ============================================================================

ARG PYTHON_VERSION=3.11
ARG ENVIRONMENT=production

# ============================================================================
# STAGE 1: SYSTEM DEPENDENCIES BUILDER
# ============================================================================
FROM python:${PYTHON_VERSION}-slim as system-deps

# Install system dependencies required for ML/CV libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build tools
    build-essential \
    gcc \
    g++ \
    pkg-config \
    # Computer Vision and OCR dependencies
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-dev \
    # Tesseract OCR system dependencies
    tesseract-ocr \
    tesseract-ocr-por \
    libtesseract-dev \
    # PostgreSQL client libraries for Supabase
    libpq-dev \
    # Image processing
    libopencv-dev \
    libgl1-mesa-glx \
    libgthread-2.0-0 \
    # Security and networking
    curl \
    ca-certificates \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# ============================================================================
# STAGE 2: PYTHON DEPENDENCIES BUILDER
# ============================================================================
FROM python:${PYTHON_VERSION}-slim as python-deps

# Copy system dependencies from previous stage
COPY --from=system-deps /usr/lib /usr/lib
COPY --from=system-deps /usr/bin/tesseract /usr/bin/tesseract
COPY --from=system-deps /usr/share/tesseract-ocr /usr/share/tesseract-ocr

# Install minimal build dependencies for Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libpq-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy and install Python dependencies with optimizations
COPY requirements.txt .

# Install Python packages with build optimizations
RUN pip install --upgrade pip setuptools wheel && \
    # Security packages first (smaller, faster builds)
    pip install --no-cache-dir \
        authlib==1.6.4 \
        PyJWT==2.10.1 \
        cryptography==46.0.1 \
        bleach==6.2.0 && \
    # Core Flask packages
    pip install --no-cache-dir \
        Flask==3.1.2 \
        Flask-CORS==6.0.1 \
        gunicorn==23.0.0 && \
    # AI/ML packages (heaviest, install separately for better caching)
    pip install --no-cache-dir \
        torch==2.8.0 \
        torchvision>=0.19.0 \
        sentence-transformers==5.1.0 \
        chromadb>=0.4.0 && \
    # Computer Vision packages
    pip install --no-cache-dir \
        opencv-python-headless==4.10.0.84 \
        Pillow==10.4.0 \
        pytesseract==0.3.10 \
        easyocr==1.7.1 && \
    # Remaining packages
    pip install --no-cache-dir -r requirements.txt && \
    # Clean up pip cache and compiled files
    pip cache purge && \
    find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11/site-packages -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# ============================================================================
# STAGE 3: PRODUCTION RUNTIME
# ============================================================================
FROM python:${PYTHON_VERSION}-slim as production

ARG ENVIRONMENT

# Set production environment variables
ENV ENVIRONMENT=${ENVIRONMENT}
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV FLASK_ENV=production
ENV DEBUG=False

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Runtime libraries for OpenCV and OCR
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgl1-mesa-glx \
    libgthread-2.0-0 \
    # PostgreSQL client
    libpq5 \
    # Process management and health checks
    dumb-init \
    curl \
    ca-certificates \
    # Tesseract runtime
    tesseract-ocr \
    tesseract-ocr-por \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Create non-root user for security
RUN groupadd -r medicalapp && useradd -r -g medicalapp -u 1001 medicalapp

WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy application code with proper ownership
COPY --chown=medicalapp:medicalapp . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/uploads /app/cache /app/data && \
    chown -R medicalapp:medicalapp /app

# Create optimized entrypoint script
RUN cat > /app/entrypoint.sh << 'ENTRYPOINT_EOF'
#!/bin/bash
set -e

echo "🏥 Starting Roteiro de Dispensação API - Environment: ${ENVIRONMENT}"

# Validate critical dependencies
python -c "
try:
    import flask, openai, chromadb, pydantic, cv2, PIL
    print('✅ Core dependencies validated')
except ImportError as e:
    print(f'❌ Dependency validation failed: {e}')
    exit(1)
"

# Set Tesseract path for pytesseract
export TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

# Start application with optimized gunicorn configuration
exec gunicorn main:app \
    --bind 0.0.0.0:8080 \
    --workers 2 \
    --worker-class sync \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --timeout 30 \
    --keep-alive 2 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --capture-output
ENTRYPOINT_EOF

RUN chmod +x /app/entrypoint.sh && \
    chown medicalapp:medicalapp /app/entrypoint.sh

# Switch to non-root user
USER medicalapp

# Health check optimized for medical application
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Expose port
EXPOSE 8080

# Use entrypoint script
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/app/entrypoint.sh"]

# ============================================================================
# METADATA AND LABELS
# ============================================================================
LABEL maintainer="Roteiro de Dispensação Medical AI" \
      version="3.0.0" \
      description="Optimized Flask medical application with AI personas" \
      environment="${ENVIRONMENT}" \
      security.hardened="true" \
      medical.lgpd_compliant="true" \
      ai.personas="dr_gasnelio,ga" \
      build.multi_stage="true"