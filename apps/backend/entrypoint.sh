#!/bin/bash
set -e

echo "🏥 Starting Roteiro de Dispensação API - $(date)"
echo "📊 Container Environment Debug Info:"
echo "  - PORT: ${PORT:-8080}"
echo "  - ENVIRONMENT: ${ENVIRONMENT:-unknown}"
echo "  - Python version: $(python --version)"
echo "  - Working directory: $(pwd)"
echo "  - User: $(whoami)"

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
exec gunicorn main:app \
    --bind 0.0.0.0:8080 \
    --workers 1 \
    --worker-class sync \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --timeout 120 \
    --keep-alive 2 \
    --log-level debug \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --preload