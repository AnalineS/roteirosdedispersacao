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
    libopencv-dev libgl1-mesa-glx libgthread-2.0-0 \
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
    libgl1-mesa-glx libgthread-2.0-0 \
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

# Create optimized entrypoint script using COPY heredoc (most reliable approach)
COPY <<EOF entrypoint.sh
#!/bin/bash
set -e

echo "🏥 Starting Roteiro de Dispensação API - \$(date)"
echo "📊 Container Environment Debug Info:"
echo "  - PORT: \${PORT:-8080}"
echo "  - ENVIRONMENT: \${ENVIRONMENT:-unknown}"
echo "  - Python version: \$(python --version)"
echo "  - Working directory: \$(pwd)"
echo "  - User: \$(whoami)"

# Detailed dependency validation with full error info
echo "🔍 Validating critical dependencies..."
python -c "
import sys
critical_deps = ['flask', 'openai', 'pydantic', 'psycopg2', 'gunicorn']
for dep in critical_deps:
    try:
        __import__(dep)
        print(f'✅ {dep}: OK')
    except ImportError as e:
        print(f'❌ {dep}: FAILED - {e}')
        if dep in ['flask', 'gunicorn']:
            print(f'💥 CRITICAL: {dep} is required for startup')
            sys.exit(1)
        else:
            print(f'⚠️  WARNING: {dep} missing but continuing...')
"

# Test basic Flask app import before gunicorn
echo "🧪 Testing Flask app import..."
python -c "
try:
    from main import app
    print('✅ Flask app imported successfully')
except Exception as e:
    print(f'❌ Flask app import failed: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
"

echo "🚀 Starting gunicorn server..."
# Start application with detailed logging
exec gunicorn main:app \\
    --bind 0.0.0.0:8080 \\
    --workers 1 \\
    --worker-class sync \\
    --worker-connections 1000 \\
    --max-requests 1000 \\
    --max-requests-jitter 100 \\
    --timeout 120 \\
    --keep-alive 2 \\
    --log-level debug \\
    --access-logfile - \\
    --error-logfile - \\
    --capture-output \\
    --preload
EOF

RUN chmod +x entrypoint.sh

# Health check for medical application
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Expose port
EXPOSE 8080

# Use simplified entrypoint
ENTRYPOINT ["dumb-init", "--", "./entrypoint.sh"]

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