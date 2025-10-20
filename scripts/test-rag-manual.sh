#!/bin/bash
# Manual RAG System Testing Script
# Tests RAG accuracy and response quality
set -e

QUERY=""
DETAILED=false
BENCHMARK=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -q|--query) QUERY="$2"; shift ;;
        -d|--detailed) DETAILED=true ;;
        -b|--benchmark) BENCHMARK=true ;;
        -h|--help)
            echo "Usage: $0 [--query <text>] [--detailed] [--benchmark] [--help]"
            echo ""
            echo "Options:"
            echo "  -q, --query      Run RAG query with specific text"
            echo "  -d, --detailed   Show detailed RAG analysis"
            echo "  -b, --benchmark  Run full RAG accuracy benchmark"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --query 'Qual a dose de rifampicina?'"
            echo "  $0 --benchmark"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "🧪 Manual RAG System Testing"
echo "========================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Activate virtual environment if it exists
if [ -d "apps/backend/venv" ]; then
    echo "🔧 Activating virtual environment..."
    source apps/backend/venv/bin/activate
fi

# Install dependencies
cd apps/backend
echo "📦 Installing test dependencies..."
pip install -q -r requirements.txt pytest

# Run tests based on mode
echo ""
echo "🚀 Starting RAG tests..."
echo "========================================"
echo ""

if [ "$BENCHMARK" = true ]; then
    # Run full benchmark
    echo "📊 Running full RAG accuracy benchmark..."
    python ../../scripts/test_rag_accuracy.py --benchmark

elif [ -n "$QUERY" ]; then
    # Run single query test
    echo "🔍 Testing RAG query: $QUERY"
    python -c "
import os
import sys
from services.real_rag_system import get_rag_system

try:
    rag = get_rag_system()
    result = rag.query(
        query='$QUERY',
        persona='gasnelio',
        top_k=5
    )

    print('')
    print('📋 RAG Query Results')
    print('=' * 50)
    print(f'Query: $QUERY')
    print(f'Documents retrieved: {len(result.get(\"sources\", []))}')
    print(f'Confidence score: {result.get(\"confidence\", 0):.2f}')
    print('')
    print('📄 Response:')
    print(result.get('response', 'No response'))
    print('')

    if $DETAILED:
        print('🔍 Retrieved Sources:')
        for i, source in enumerate(result.get('sources', []), 1):
            print(f'  {i}. Relevance: {source.get(\"score\", 0):.2f}')
            print(f'     Content: {source.get(\"content\", \"\")[:100]}...')
            print('')

    sys.exit(0 if result.get('confidence', 0) > 0.5 else 1)

except Exception as e:
    print(f'❌ Error during RAG query: {e}')
    sys.exit(1)
"

else
    # Run unit tests
    echo "🧪 Running RAG unit tests..."
    if [ -f "tests/test_rag_system.py" ]; then
        python -m pytest tests/test_rag_system.py -v --tb=short
    elif [ -f "tests/test_03_performance_load.py" ]; then
        python -m pytest tests/test_03_performance_load.py -k "rag" -v --tb=short
    else
        echo "⚠️ No RAG-specific tests found"
        echo ""
        echo "Running basic RAG connectivity test..."
        python -c "
from services.real_rag_system import get_rag_system

rag = get_rag_system()
result = rag.query(
    query='teste de conectividade',
    persona='gasnelio',
    top_k=3
)

if result and 'response' in result:
    print('✅ RAG system is operational')
else:
    print('❌ RAG system returned invalid response')
    exit(1)
"
    fi
fi

echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

if [ "$BENCHMARK" = true ]; then
    echo "Mode: Full benchmark"
elif [ -n "$QUERY" ]; then
    echo "Mode: Single query"
    echo "Query: $QUERY"
else
    echo "Mode: Unit tests"
fi
