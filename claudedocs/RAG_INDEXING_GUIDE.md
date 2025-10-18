# RAG Knowledge Base Indexing Guide

**Purpose**: Populate the Supabase vector store with medical knowledge base content to enable semantic search and RAG retrieval.

---

## Quick Start

### Prerequisites

```bash
# Required environment variables
export OPENROUTER_API_KEY="your-key-here"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-anon-key"
# OR
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

### Index Knowledge Base

```bash
# From repository root
cd "c:\Users\Ana\Meu Drive\Site roteiro de dispensação"

# Dry run first (verify without indexing)
python scripts/index_knowledge_base.py --dry-run

# Execute actual indexing
python scripts/index_knowledge_base.py

# Force reindex (overwrite existing)
python scripts/index_knowledge_base.py --force
```

### Using GitHub CLI (Production)

```bash
# Set secrets in environment
gh secret set OPENROUTER_API_KEY
gh secret set SUPABASE_URL
gh secret set SUPABASE_KEY

# Run with GitHub secrets
gh secret list | python scripts/index_knowledge_base.py
```

---

## What Gets Indexed

### Markdown Files (3 files)
```
data/knowledge-base/
├── hanseniase.md (11.8 KB)
├── roteiro_hanseniase_basico.md (1.5 KB)
└── hanseniase.pdf (not processed - PDF requires special handling)
```

### Structured JSON Files (9 files)
```
data/structured/
├── clinical_taxonomy.json (11.6 KB) - priority: 0.8
├── dosing_protocols.json (7.2 KB) - priority: 1.0 [CRITICAL]
├── medications_mechanisms.json (10.1 KB) - priority: 0.7
├── dispensing_workflow.json (11.3 KB) - priority: 0.9
├── pharmacovigilance_guidelines.json (11.0 KB) - priority: 0.95 [CRITICAL]
├── hanseniase_catalog.json (7.9 KB) - priority: 0.8
├── quick_reference_protocols.json (10.9 KB) - priority: 0.85
├── frequently_asked_questions.json (14.2 KB) - priority: 0.6
└── knowledge_scope_limitations.json (10.1 KB) - priority: 0.5
```

**Total**: 12 files → ~500-1000 indexed chunks

---

## Indexing Process

### 1. Chunk Extraction

**Markdown Files**:
- Split by double newline (paragraphs)
- Minimum 50 characters per chunk
- Content-based classification:
  - "dosagem/dose/mg" → `dosage` (priority: 1.0)
  - "contraindicação/efeito colateral" → `safety` (priority: 0.95)
  - "protocolo/procedimento" → `protocol` (priority: 0.85)
  - Other → `general` (priority: 0.7)

**JSON Files**:
- Recursive text extraction from nested structures
- Minimum 50 characters per text value
- Preserves JSON path as metadata
- Content refinement boosts priority:
  - Contains "dosagem" → +0.1 priority
  - Contains "contraindicação" → +0.05 priority

### 2. Embedding Generation

**Model**: `openai/text-embedding-3-small` (via OpenRouter)
- 1536 dimensions
- Free tier compatible
- Multilingual (Portuguese optimized)

**API Call**:
```python
response = client.embeddings.create(
    model="openai/text-embedding-3-small",
    input=text
)
embedding = response.data[0].embedding  # List[float] of length 1536
```

**Rate Limiting**:
- 0.5 second delay every 10 chunks
- Prevents API throttling
- ~600 chunks = ~5-10 minutes

### 3. Vector Storage

**Table**: `medical_embeddings` (Supabase PostgreSQL + pgvector)

**Schema**:
```sql
CREATE TABLE medical_embeddings (
    id TEXT PRIMARY KEY,              -- SHA-256 hash of content
    text TEXT NOT NULL,               -- Original chunk text
    embedding VECTOR(1536),           -- OpenAI embedding
    chunk_type TEXT NOT NULL,         -- dosage/safety/protocol/etc
    priority REAL NOT NULL,           -- 0.0-1.0 medical priority
    source_file TEXT,                 -- Original filename
    metadata JSONB,                   -- Additional context
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Vector similarity search index
CREATE INDEX medical_embeddings_vector_idx
ON medical_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Indexing**:
- Unique ID per chunk (prevents duplicates)
- Skip existing unless `--force` flag
- Local fallback if Supabase unavailable

---

## Verification

### Check Document Count

**Via Script**:
```python
python scripts/index_knowledge_base.py
# Output includes verification:
# Verification passed: 587 documents indexed
```

**Via Supabase Dashboard**:
```sql
-- SQL Editor
SELECT COUNT(*) FROM medical_embeddings;
-- Expected: 500-1000 rows

SELECT chunk_type, COUNT(*), AVG(priority)
FROM medical_embeddings
GROUP BY chunk_type
ORDER BY AVG(priority) DESC;
-- Expected distribution:
-- dosage: ~80-120 chunks (priority ~1.0)
-- safety: ~60-90 chunks (priority ~0.95)
-- protocol: ~100-150 chunks (priority ~0.85-0.9)
-- etc.
```

### Test Semantic Search

**Via API**:
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "qual a dosagem de rifampicina?",
    "persona": "dr_gasnelio"
  }'

# Expected response:
{
  "response": "...[contexto específico]...",
  "rag_used": true,
  "rag_system": "supabase",
  "sources": ["dosing_protocols.json", "quick_reference_protocols.json"],
  "confidence": 0.87  // Should be 0.75+
}
```

**Via Python**:
```python
from services.rag.supabase_rag_system import get_rag_system

rag = get_rag_system()
context = rag.retrieve_context("dosagem rifampicina", max_chunks=3)

print(f"Chunks found: {len(context.chunks)}")
print(f"Confidence: {context.confidence_level}")
print(f"Sources: {context.source_files}")

# Expected:
# Chunks found: 3
# Confidence: high
# Sources: ['dosing_protocols.json', ...]
```

---

## Expected Output

### Successful Indexing

```
2025-10-08 14:30:00 - INFO - Knowledge Base Indexer initialized
2025-10-08 14:30:00 - INFO - Connected to Supabase vector store
2025-10-08 14:30:01 - INFO - Environment validation passed
2025-10-08 14:30:01 - INFO - Processing markdown files...
2025-10-08 14:30:01 - INFO - Processing markdown: hanseniase.md
2025-10-08 14:30:02 - INFO - Extracted 45 chunks from hanseniase.md
2025-10-08 14:30:02 - INFO - Processing markdown: roteiro_hanseniase_basico.md
2025-10-08 14:30:02 - INFO - Extracted 12 chunks from roteiro_hanseniase_basico.md
2025-10-08 14:30:02 - INFO - Processing JSON files...
2025-10-08 14:30:02 - INFO - Processing JSON: dosing_protocols.json
2025-10-08 14:30:03 - INFO - Extracted 87 chunks from dosing_protocols.json
...
2025-10-08 14:30:45 - INFO - Indexing 587 chunks...
2025-10-08 14:30:50 - INFO - Progress: 50/587 chunks processed
2025-10-08 14:31:20 - INFO - Progress: 100/587 chunks processed
...
2025-10-08 14:38:15 - INFO - ============================================================
2025-10-08 14:38:15 - INFO - INDEXING COMPLETE
2025-10-08 14:38:15 - INFO - ============================================================
2025-10-08 14:38:15 - INFO - Files processed: 11
2025-10-08 14:38:15 - INFO - Chunks created: 587
2025-10-08 14:38:15 - INFO - Embeddings generated: 587
2025-10-08 14:38:15 - INFO - Documents indexed: 587
2025-10-08 14:38:15 - INFO - Success rate: 587/587 (100.0%)
2025-10-08 14:38:15 - INFO - Duration: 0:08:15
2025-10-08 14:38:15 - INFO - Errors: 0
2025-10-08 14:38:15 - INFO - Verifying indexing...
2025-10-08 14:38:16 - INFO - Vector store statistics:
2025-10-08 14:38:16 - INFO -   Backend: supabase
2025-10-08 14:38:16 - INFO -   Documents: 587
2025-10-08 14:38:16 - INFO -   Connected: True
2025-10-08 14:38:16 - INFO - Verification passed: 587 documents indexed
2025-10-08 14:38:16 - INFO - SUCCESS: Knowledge base fully indexed and verified
```

### Report File

**Location**: `scripts/indexing_report_YYYYMMDD_HHMMSS.json`

```json
{
  "stats": {
    "files_processed": 11,
    "chunks_created": 587,
    "embeddings_generated": 587,
    "documents_indexed": 587,
    "errors": [],
    "start_time": "2025-10-08T14:30:00",
    "end_time": "2025-10-08T14:38:16"
  },
  "config": {
    "force_reindex": false,
    "dry_run": false,
    "supabase_url": "https://xxxxx.supabase.co",
    "embedding_model": "openai/text-embedding-3-small"
  }
}
```

---

## Troubleshooting

### Issue: "OPENROUTER_API_KEY not set"

**Solution**:
```bash
export OPENROUTER_API_KEY="sk-or-v1-xxxxx"
```

Or use GitHub CLI:
```bash
gh secret set OPENROUTER_API_KEY
```

### Issue: "Supabase not connected - using local fallback"

**Symptoms**:
- Script runs but shows "using local fallback"
- Documents indexed locally, not in Supabase

**Causes**:
1. Missing `SUPABASE_URL` or `SUPABASE_KEY`
2. Invalid credentials
3. Network connectivity issues

**Solution**:
```bash
# Verify credentials
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Test connection
curl -H "apikey: $SUPABASE_KEY" \
     -H "Authorization: Bearer $SUPABASE_KEY" \
     "$SUPABASE_URL/rest/v1/"
# Should return: {"message":"..."}
```

### Issue: "Failed to generate embedding"

**Symptoms**:
- Embeddings generated: 0
- API errors in logs

**Causes**:
1. Invalid OpenRouter API key
2. API rate limiting
3. Model not available on free tier

**Solution**:
```bash
# Test API key
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
# Should return model list

# Verify free tier model
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "openai/text-embedding-3-small",
    "input": "test"
  }'
```

### Issue: "No documents in vector store"

**Symptoms**:
- Indexing completes
- Verification shows 0 documents

**Causes**:
1. Row-level security (RLS) blocking inserts
2. Wrong API key (anon vs service)
3. Table permissions issue

**Solution**:

1. **Check RLS**:
```sql
-- In Supabase SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'medical_embeddings';

-- If rowsecurity = true, disable for service role:
ALTER TABLE medical_embeddings DISABLE ROW LEVEL SECURITY;
```

2. **Use Service Role Key**:
```bash
# Service role key has admin access
export SUPABASE_SERVICE_KEY="eyJhbGci..."
python scripts/index_knowledge_base.py
```

3. **Check Permissions**:
```sql
-- Grant insert permission
GRANT INSERT ON medical_embeddings TO anon;
GRANT INSERT ON medical_embeddings TO authenticated;
```

### Issue: Low success rate (< 90%)

**Symptoms**:
- Success rate: 450/587 (76.7%)
- Multiple embedding errors

**Causes**:
1. API rate limiting
2. Network timeouts
3. Invalid text content

**Solution**:

1. **Increase delay**:
```python
# In index_knowledge_base.py, line ~390
if not self.dry_run and i % 10 == 0:
    time.sleep(1.0)  # Increase from 0.5 to 1.0
```

2. **Retry failed chunks**:
```bash
# Run again - existing chunks skipped automatically
python scripts/index_knowledge_base.py
```

3. **Force reindex specific files**:
```python
# Modify script to process only failed sources
# Check indexing_report_*.json for error details
```

---

## Deployment Strategies

### Local Development

```bash
# Use local .env file
cat > apps/backend/.env <<EOF
OPENROUTER_API_KEY=sk-or-v1-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...
EOF

python scripts/index_knowledge_base.py
```

### CI/CD Pipeline (GitHub Actions)

**Not recommended**: Indexing in CI/CD is slow and costs API credits.

**Better**: One-time manual indexing, then deploy app.

### Production Deployment

**Option 1: Local Indexing → Deploy App**
```bash
# 1. Index locally with production credentials
export SUPABASE_URL="https://prod.supabase.co"
export SUPABASE_SERVICE_KEY="prod-service-key"
python scripts/index_knowledge_base.py

# 2. Verify
curl https://prod.supabase.co/rest/v1/medical_embeddings?select=count

# 3. Deploy app (data already in Supabase)
gcloud run deploy backend --region=us-central1
```

**Option 2: Cloud Run Job**
```bash
# Create one-time Cloud Run job
gcloud run jobs create rag-indexer \
  --image=gcr.io/project/backend:latest \
  --command="python,scripts/index_knowledge_base.py" \
  --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_KEY=$SUPABASE_KEY" \
  --set-secrets="OPENROUTER_API_KEY=openrouter-key:latest"

# Execute once
gcloud run jobs execute rag-indexer

# Check logs
gcloud run jobs logs read rag-indexer
```

### Health Check Endpoint

**Add to Flask app**:
```python
@app.route('/api/rag/health')
def rag_health():
    from services.integrations.supabase_vector_store import get_vector_store

    store = get_vector_store()
    stats = store.get_stats()

    doc_count = stats.get('supabase_documents', 0)

    return jsonify({
        'status': 'healthy' if doc_count > 100 else 'degraded',
        'indexed_documents': doc_count,
        'backend': stats.get('backend'),
        'connected': stats.get('supabase_connected'),
        'message': 'RAG system operational' if doc_count > 100 else 'RAG needs indexing'
    })
```

**Monitor**:
```bash
curl https://your-app.run.app/api/rag/health

# Expected:
{
  "status": "healthy",
  "indexed_documents": 587,
  "backend": "supabase",
  "connected": true,
  "message": "RAG system operational"
}
```

---

## Maintenance

### Update Knowledge Base

**When**: New medical guidelines, protocol updates, FAQ additions

**Process**:
1. Update JSON/MD files in `data/` directory
2. Run indexing with `--force` flag:
   ```bash
   python scripts/index_knowledge_base.py --force
   ```
3. Verify new content:
   ```bash
   curl -X POST /api/chat \
     -d '{"message": "new query about updated content"}'
   ```

### Clear and Rebuild

**When**: Major knowledge base restructuring, corrupt data

**Process**:
```sql
-- In Supabase SQL Editor
TRUNCATE TABLE medical_embeddings;
```

```bash
# Reindex from scratch
python scripts/index_knowledge_base.py
```

### Monitor Index Health

**Metrics to track**:
- Document count (should be 500-1000)
- Average search results per query (should be 3-5)
- RAG confidence scores (should be 0.75+)
- Sources attribution (should be non-empty)

**Query**:
```sql
SELECT
    chunk_type,
    COUNT(*) as chunks,
    AVG(priority) as avg_priority,
    COUNT(DISTINCT source_file) as unique_sources
FROM medical_embeddings
GROUP BY chunk_type
ORDER BY avg_priority DESC;
```

---

## Cost Estimation

### OpenRouter Embeddings

**Model**: `openai/text-embedding-3-small`
- Free tier: Limited requests/month
- Paid: ~$0.00002 per 1K tokens

**Calculation**:
- 587 chunks × 100 tokens avg = 58,700 tokens
- Cost: ~$0.001 (essentially free)

**One-time cost**: < $0.01 for full indexing

### Supabase Storage

**PostgreSQL + pgvector**:
- Free tier: 500MB database
- Vector storage: 1536 dims × 4 bytes × 587 docs = ~3.6 MB
- Text storage: ~500 KB
- Total: ~4.1 MB (< 1% of free tier)

**Ongoing cost**: $0/month (within free tier)

---

## Summary

**Time to index**: 5-10 minutes
**Cost**: < $0.01 one-time
**Documents indexed**: 500-1000 chunks
**Storage used**: ~4 MB
**RAG improvement**: 0% → 90%+ retrieval success

**Next steps after indexing**:
1. Verify with test queries
2. Monitor RAG confidence scores
3. Update knowledge base quarterly
4. Add health check to monitoring dashboard
