#!/bin/bash
set -e

echo "Starting API - $(date)"
echo "PORT: ${PORT:-8080}"
echo "ENVIRONMENT: ${ENVIRONMENT:-unknown}"

# Export UTF-8 environment variables
export PYTHONIOENCODING=utf-8
export LANG=C.UTF-8
export LC_ALL=C.UTF-8

# Quick Flask validation
python -c "from flask import Flask; print('Flask OK')" || exit 1

# Start gunicorn with minimal config for fast startup
exec gunicorn main:app \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers 1 \
    --timeout 30 \
    --log-level info