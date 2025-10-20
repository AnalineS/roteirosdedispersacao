#!/bin/bash
# Medical Knowledge Base Indexing Script
# Consolidates index-knowledge-base.yml + index-supabase.yml workflows
set -e

FORCE_REINDEX=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --force) FORCE_REINDEX=true ;;
        -h|--help)
            echo "Usage: $0 [--force] [--help]"
            echo ""
            echo "Options:"
            echo "  --force    Force complete reindexing (deletes existing embeddings)"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "📚 Indexing Medical Knowledge Base to Supabase..."
echo "========================================"
echo "Force reindex: $FORCE_REINDEX"
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
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt huggingface_hub

# Run indexing
echo ""
echo "🚀 Starting indexing process..."
echo "========================================"

if [ "$FORCE_REINDEX" = true ]; then
    python ../../scripts/index_knowledge_base.py --force
else
    python ../../scripts/index_knowledge_base.py
fi

# Verify indexing
echo ""
echo "🔍 Verifying indexing..."
echo "========================================"

python -c "
import os
import sys

try:
    from supabase import create_client

    # Create Supabase client
    supabase_url = os.environ.get('SUPABASE_PROJECT_URL')
    supabase_key = os.environ.get('SUPABASE_PUBLISHABLE_KEY')

    if not supabase_url or not supabase_key:
        print('❌ Error: SUPABASE_PROJECT_URL and SUPABASE_PUBLISHABLE_KEY environment variables required')
        sys.exit(1)

    client = create_client(supabase_url, supabase_key)

    # Count indexed documents
    result = client.table('medical_embeddings').select('id', count='exact').execute()

    doc_count = result.count if hasattr(result, 'count') else len(result.data)
    print(f'✅ Indexed documents: {doc_count}')

    if doc_count < 100:
        print(f'⚠️ Warning: Expected at least 100 documents, found {doc_count}')
        sys.exit(1)

    print('')
    print('🎉 Knowledge base indexing completed successfully!')

except ImportError as e:
    print(f'❌ Error: Missing dependency - {e}')
    print('Install required packages: pip install supabase')
    sys.exit(1)
except Exception as e:
    print(f'❌ Error during verification: {e}')
    sys.exit(1)
"

echo ""
echo "========================================"
echo "📊 Indexing Summary"
echo "========================================"
echo "Status: Completed"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "Force reindex: $FORCE_REINDEX"
